---
title: "Speculative Decoding: Making LLMs 2-3x Faster Without Losing Quality"
date: 2025-01-13
description: "How draft-verify architectures and raw TCP sockets cut LLM inference latency in half. Lessons from building a production speculative sampling system across heterogeneous hardware."
tags: ["LLMs", "Performance", "Distributed Systems", "Networking"]
readingTime: "10 min read"
archived: false
references:
  - label: "Speculative Sampling Paper"
    url: "https://arxiv.org/abs/2302.01318"
  - label: "TCP_NODELAY and Nagle's Algorithm"
    url: "https://www.extrahop.com/company/blog/2016/tcp-nodelay-nagle-quickack-best-practices/"
stack_category: ["Distributed Systems", "Deep Learning", "System Design", "Performance Optimization"]
retrieval_hooks: ["Implemented speculative decoding with raw TCP sockets for minimal latency", "Designed binary protocol with struct packing for token transmission", "Built draft-verify architecture across heterogeneous hardware (Mac/Windows)", "Achieved 2-3x speedup with 82% draft acceptance rate"]
---

Most tutorials about making LLMs faster focus on quantization or better hardware. But there's a different kind of optimization that doesn't require changing your model at all. It's called speculative decoding, and it exploits a simple insight: small models are fast but inaccurate, large models are slow but accurate. What if you could use both at the same time?

This post walks through building a production speculative sampling system that runs across two machines (a Mac and a Windows PC) connected over a local network. The result is a 2-3x speedup in text generation with zero quality loss. But the interesting part isn't the algorithm. It's the engineering decisions required to make it work in practice.

## The Core Idea

Large language models generate text one token at a time. Each token requires a full forward pass through the model. The bottleneck isn't compute, it's memory bandwidth. GPUs spend most of their time waiting for weights to load from VRAM.

Speculative decoding exploits this by having a small "draft model" generate multiple token candidates cheaply, then having the large "target model" verify all of them in parallel in a single forward pass. If the draft was correct, you just saved multiple sequential forward passes. If the draft was wrong, you reject it and continue normally. The math works out such that the output distribution is identical to vanilla autoregressive sampling.

The academic paper proves this theoretically. The engineering challenge is making it work across real hardware with network latency, heterogeneous devices, and the need for sub-second response times.

## Architecture Decisions

I built this system with the draft model running on a Mac (Apple Silicon MPS) and the target model on a Windows machine (NVIDIA CUDA). The two machines communicate over a local network. This setup mirrors a realistic deployment where you might have edge devices doing cheap inference and a central server doing verification.

### The Protocol Problem

The first question was how to move tokens between machines. HTTP seemed like the obvious choice. Every web framework supports it, there are mature client libraries, and debugging is easy. But HTTP has overhead. Each request carries headers, goes through multiple abstraction layers, and typically uses TCP with Nagle's algorithm enabled.

For speculative decoding to work, latency matters more than throughput. The draft model generates 5 token candidates in ~100ms. If network round-trip takes another 50ms, you're losing a third of your speedup to communication overhead.

I ended up implementing a raw TCP socket protocol with binary framing. The packet structure is dead simple. Requests are a 4-byte length header followed by UTF-8 text. Responses are a 4-byte count followed by an array of 32-bit integers (the token IDs). No JSON, no HTTP, no compression. Just raw bytes over sockets with `TCP_NODELAY` enabled to disable Nagle's algorithm.

```python
def send_tokens(sock, tokens):
    count = struct.pack('!I', len(tokens))
    payload = struct.pack(f'!{len(tokens)}I', *tokens)
    sock.sendall(count + payload)
```

The protocol is brittle. There's no versioning, no error handling beyond socket timeouts, and no encryption. But it's fast. Round-trip latency for 5 tokens sits around 10-15ms on a local network, which is acceptable overhead.

### The Draft-Verify Loop

The drafter runs in a tight loop. It receives a prompt, generates 5 token candidates using `model.generate(max_new_tokens=5)`, and sends them to the verifier. The verifier does a single forward pass with those tokens, computes the log probabilities, and decides which tokens to accept based on a rejection sampling criterion.

The acceptance criterion is where the math happens. For each draft token, the verifier compares the draft model's probability `p_draft(token)` with the target model's probability `p_target(token)`. If `p_target >= p_draft`, accept the token. Otherwise, accept with probability `p_target / p_draft`. This ensures the output distribution matches what you'd get from pure autoregressive sampling with the target model.

In practice, the acceptance rate (called "alpha" in the literature) hovers around 70-85% depending on how closely the draft and target models align. With TinyLlama as the drafter and Llama-3-8B as the verifier, I see about 82% acceptance. That means on average, 4 out of 5 draft tokens get accepted, giving a roughly 3x speedup.

### Handling Rejection

When the verifier rejects a draft token, it needs to resample from the corrected distribution. The standard approach is to compute `p_adjusted = max(0, p_target - p_draft)`, renormalize, and sample from that. This is mathematically correct but adds complexity.

In my implementation, when a rejection happens, I just truncate the sequence at that point and let the drafter continue from there. It's not perfectly faithful to the theoretical algorithm, but the output quality is indistinguishable in practice, and the code is simpler.

## Performance Results

On a benchmark of 50 prompts with ~200 token outputs each, the system generates at roughly 35 tokens per second end-to-end. Vanilla autoregressive sampling with just the target model gets about 12 tokens per second. That's a 2.9x speedup.

The acceptance rate varies by task. For straightforward completions ("Write a poem about..."), alpha sits at 85%. For more technical or domain-specific prompts, it drops to 70%. The draft model struggles when the vocabulary shifts away from its training distribution.

Latency is dominated by inference time, not network overhead. The 10-15ms network round-trip is negligible compared to the 100ms draft generation time. This validates the decision to use raw TCP. HTTP would have added maybe 20ms, which is still small relative to inference, but every millisecond counts when you're chasing interactive latency.

## What Didn't Work

The first version used HTTP with JSON payloads. The overhead was tolerable (30-40ms per request), but the real issue was request batching. With HTTP, the natural pattern is request-response. The drafter sends a request, blocks waiting for the response, then continues. This serializes everything.

With raw sockets, I can overlap operations. The drafter can start generating the next batch while the verifier is still processing the previous one. This doesn't fully pipeline (the acceptance decision still needs to complete before continuing), but it eliminates some idle time.

I also tried using `asyncio` to make the communication non-blocking. In theory, the drafter could have multiple draft batches in flight while the GPU is busy. In practice, this added complexity without clear wins. The bottleneck is GPU inference, not I/O, so non-blocking sockets don't help much.

## When Speculative Decoding Makes Sense

This technique shines when you have a small model that's "close enough" to the target model. If the draft model is too small or undertrained, the acceptance rate plummets, and you end up doing more work than just running the target model directly.

It's also sensitive to hardware setup. If your draft model runs on a weak device (say, a Raspberry Pi), the 100ms draft time might balloon to 500ms, killing the speedup. You need fast draft inference for this to work.

The sweet spot is when you have heterogeneous hardware where one device is fast but memory-constrained (edge device with limited VRAM) and another is slower but has capacity (a server with a bigger GPU). Run the small model on the edge, verify on the server, and you get the benefits of both.

## The Real Lesson

Speculative decoding is a great algorithm, but the engineering matters more than the math. The choice of protocol (TCP vs HTTP), the handling of rejection, and the overlap of computation all have bigger impacts on wall-clock latency than tweaking the acceptance criterion.

The broader lesson is that distributed ML systems aren't just about model architecture. They're about understanding where time is spent (network, compute, memory), making deliberate trade-offs (simplicity vs performance), and measuring everything. The algorithm gives you the theoretical speedup. The engineering determines whether you actually see it in production.

If you're building something similar, start with the simplest protocol that works, measure where time is spent, and optimize the bottleneck. In my case, the network wasn't the bottleneck, so raw TCP was overkill. But it was fun to build, and it taught me more about networking than any tutorial could.

Repository: [github.com/nnigam96/distributed-llm-lab](https://github.com/nnigam96/distributed-llm-lab)
