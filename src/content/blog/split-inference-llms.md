---
title: "Split Inference: Running 70B Models on Consumer Hardware"
date: 2025-01-13
description: "How to run models larger than your GPU by slicing them across devices. Trading network bandwidth for VRAM using torch.distributed.rpc and careful tensor serialization."
tags: ["LLMs", "Distributed Systems", "VRAM Optimization", "System Design"]
readingTime: "10 min read"
archived: false
references:
  - label: "torch.distributed.rpc Documentation"
    url: "https://pytorch.org/docs/stable/rpc.html"
  - label: "Pipeline Parallelism"
    url: "https://arxiv.org/abs/1811.06965"
stack_category: ["Distributed Systems", "Deep Learning", "System Design", "Performance Optimization"]
retrieval_hooks: ["Implemented split inference using torch.distributed.rpc for cross-device model execution", "Designed layer-splitting strategy with configurable split points", "Built tensor serialization pipeline with CPU staging for RPC transmission", "Enabled running 70B parameter models on GPUs with 24GB VRAM"]
---

Modern language models are huge. Llama-70B has 70 billion parameters, requiring about 140GB of memory in FP16. But most consumer GPUs have 24GB of VRAM or less. You can't fit the model on a single device. The standard solution is to rent cloud GPUs with more memory, but that's expensive. What if you could split the model across multiple devices you already own?

This is split inference. The idea is simple: slice the neural network at a specific layer, run the first half on Device A, send the intermediate activations over the network to Device B, and run the second half there. VRAM becomes a soft constraint you can work around by trading network bandwidth.

This post walks through building a split inference system using PyTorch's RPC framework. The result is a system that runs Llama-3B (which normally needs 12GB VRAM) across two devices with 6GB each. The approach scales to larger models with more devices.

## The VRAM Wall

Neural networks process data in layers. Each layer transforms its input (activations) using learned weights. For a transformer with 32 layers, you load all 32 sets of weights into GPU memory, then run each layer sequentially.

The bottleneck is memory, not compute. A 7B parameter model has 14GB of weights. Even with quantization (4-bit or 8-bit), you're looking at 3.5-7GB of VRAM just for weights. Add activations, optimizer states, and temporary buffers, and you quickly hit the VRAM limit.

The standard solutions are model quantization (use fewer bits per weight), batch size reduction (process fewer examples at once), or gradient checkpointing (recompute activations instead of storing them). These help but don't solve the fundamental problem: you can't fit a 70B model on a 24GB GPU no matter how much you quantize.

## Splitting the Model

Split inference slices the model into two shards. Shard 1 contains layers 0 through N, Shard 2 contains layers N+1 through the end. Each shard runs on a different device. When you do inference, input flows through Shard 1, the intermediate activations are sent over the network to Shard 2, and Shard 2 produces the final output.

The split point N is configurable. For a 32-layer model, splitting at layer 16 gives roughly equal memory usage on both devices. Splitting earlier (say, layer 8) puts more work on the second device. You choose based on your hardware constraints.

The challenge is moving activations between devices efficiently. Activations for a single token might be small (a few kilobytes), but at batch size 4 or 8, you're moving megabytes per forward pass. Network latency and bandwidth become the bottleneck.

## PyTorch RPC

PyTorch provides `torch.distributed.rpc` for distributed inference. It lets you call functions on remote devices as if they were local. You define a function that runs on Device B, call it from Device A, and PyTorch handles serialization, network transmission, and deserialization.

The basic pattern looks like this:

```python
# On Device A (Shard 1)
hidden_states = shard1_model(input_ids)  # Layers 0-16
output = rpc.rpc_sync("worker2", shard2_forward, args=(hidden_states,))

# On Device B (Shard 2)
def shard2_forward(hidden_states):
    return shard2_model(hidden_states)  # Layers 17-32
```

Behind the scenes, PyTorch serializes the tensor, sends it over TCP, deserializes it on the remote worker, runs the function, and returns the result. The API is clean, but the performance depends heavily on how you handle tensors.

## Tensor Serialization

The naive approach is to send GPU tensors directly via RPC. This works but is slow. RPC serialization uses `torch.save()`, which converts tensors to bytes. For GPU tensors, this involves copying from GPU to CPU, serializing, sending over the network, deserializing, and copying back to GPU.

Each copy adds latency. A better approach is to explicitly move tensors to CPU before RPC transmission and back to GPU after reception. This sounds like more work, but it gives you control over when copies happen and lets you overlap them with computation.

Here's the optimized pattern:

```python
# Before RPC call
hidden_states_cpu = hidden_states.to('cpu')  # Async copy
output_cpu = rpc.rpc_sync("worker2", shard2_forward, args=(hidden_states_cpu,))
output = output_cpu.to('cuda')  # Async copy back
```

This reduces the number of synchronization points and allows PyTorch to schedule copies in parallel with computation.

## Latency Analysis

Split inference adds latency. A single forward pass now involves:

1. Compute on Device A (Shard 1)
2. Copy activations from GPU to CPU
3. Serialize and send over network
4. Deserialize and copy from CPU to GPU on Device B
5. Compute on Device B (Shard 2)
6. Repeat steps 2-4 in reverse for the output

For a 3B parameter model split evenly, each shard takes about 50ms to compute. The network round-trip on a local gigabit connection adds another 20-30ms. Total latency is roughly 120ms per forward pass, compared to 50ms for non-split inference. You've doubled latency but enabled running a model that wouldn't fit otherwise.

The trade-off shifts based on network speed. On a 100 Mbps connection, network latency dominates and split inference becomes impractical. On a 10 Gbps connection, the overhead is negligible. On cloud infrastructure with high-bandwidth interconnects, split inference is nearly as fast as single-device inference.

## Handling Failures

RPC calls can fail. The remote worker might crash, the network might drop, or the call might timeout. PyTorch's RPC framework provides timeout mechanisms, but recovery is manual.

I added retry logic with exponential backoff. If an RPC call fails, retry up to 3 times with increasing delays. After 3 failures, mark the worker as unavailable and fall back to single-device inference if possible.

This isn't perfect. If the remote worker is truly down, retries just waste time. A better approach is health checks (periodic pings to verify workers are alive) and preemptive failover, but that adds complexity.

## Split Training: The Harder Problem

Split inference is straightforward because data flows in one direction. Split training requires backpropagation, where gradients flow backward through both shards. PyTorch supports this with `torch.distributed.autograd`, which tracks the computation graph across RPC boundaries.

The pattern is similar to inference:

```python
with dist_autograd.context() as context_id:
    # Forward pass
    hidden_states = shard1_model(input_ids)
    output = rpc.rpc_sync("worker2", shard2_forward, args=(hidden_states,))
    loss = compute_loss(output, labels)

    # Backward pass
    dist_autograd.backward(context_id, [loss])

    # Optimizer step (updates weights on both devices)
    optimizer.step(context_id)
```

The `context_id` ties together the forward and backward passes across devices. Gradients computed on Device B automatically propagate back to Device A through the RPC boundary.

In practice, split training is slower than split inference. Each training step involves two network round-trips (forward pass activations and backward pass gradients). For a 7B model, training time increases by 3-4x compared to single-device training. You only do this when you have no other option.

## When to Use Split Inference

Split inference makes sense when VRAM is your hard constraint and network bandwidth is plentiful. The canonical use case is running frontier models (70B+) on consumer hardware by splitting across multiple GPUs.

It also works for inference serving when you have heterogeneous hardware. Put the lightweight layers on a cheap GPU, the heavy layers on an expensive one, and load-balance by splitting at different points for different requests.

It doesn't make sense when you have access to a single GPU with enough memory, or when your network is slow. The added latency and complexity aren't worth it unless you're actually VRAM-constrained.

## The Broader Lesson

Split inference is a specific example of a general principle: when you hit a hard constraint (VRAM), look for a soft constraint (network) you can trade. In distributed systems, this pattern shows up everywhere. Can't fit data in memory? Trade disk I/O. Can't process fast enough? Trade more machines. Can't parallelize? Trade latency for throughput.

The engineering skill is recognizing which constraints are hard and which are soft, then designing systems that exploit the difference. VRAM is hard because it's fixed by your hardware. Network bandwidth is soft because you can often increase it or tolerate higher latency.

Split inference is impractical for most use cases. But it's a good exercise in understanding the resource trade-offs in ML systems. When you're debugging why your model won't fit in memory, or why inference is slow, the first step is identifying which resource is the bottleneck. Then you can decide whether to optimize that resource or trade it for something else.

Repository: [github.com/nnigam96/distributed-llm-lab](https://github.com/nnigam96/distributed-llm-lab)
