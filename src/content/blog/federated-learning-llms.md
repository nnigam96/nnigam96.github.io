---
title: "Federated Learning for LLMs: Training Without Centralizing Data"
date: 2025-01-13
description: "Building a production federated learning system using Flower and LoRA adapters. How to coordinate distributed training across edge devices while keeping data local and secure."
tags: ["Federated Learning", "LLMs", "Privacy", "Distributed Systems"]
readingTime: "11 min read"
archived: false
references:
  - label: "Flower Framework"
    url: "https://flower.dev/"
  - label: "LoRA: Low-Rank Adaptation"
    url: "https://arxiv.org/abs/2106.09685"
  - label: "Federated Averaging"
    url: "https://arxiv.org/abs/1602.05629"
stack_category: ["Distributed Systems", "Deep Learning", "Privacy & Security", "MLOps & Infrastructure"]
retrieval_hooks: ["Implemented federated averaging with LoRA adapters for privacy-preserving LLM training", "Designed weighted aggregation strategy based on dataset size not simple averaging", "Built cross-platform training system supporting Apple Silicon MPS and NVIDIA CUDA", "Achieved 200x communication efficiency by transmitting rank matrices instead of full weights"]
---

Standard machine learning assumes you can collect data in one place, train a model, and deploy it. But what if the data can't leave its source? Medical records can't be centralized due to HIPAA. Financial data has regulatory constraints. Edge devices have bandwidth limitations. This is where federated learning comes in.

Federated learning flips the training paradigm. Instead of bringing data to the model, you bring the model to the data. Each client trains locally on their private dataset, then sends only the model updates back to a central server. The server aggregates these updates without ever seeing raw data. The result is a model trained on the union of all datasets while respecting privacy boundaries.

This post walks through building a production federated learning system for fine-tuning LLMs using Flower (a federated learning framework) and LoRA (Parameter-Efficient Fine-Tuning). The system coordinates training across heterogeneous hardware (Mac and Windows machines), handles network interruptions, and achieves communication efficiency through clever gradient compression.

## The Data Gravity Problem

In standard distributed training, you have multiple GPUs in a data center connected by high-bandwidth interconnects. You can shuffle data, replicate it, and synchronize gradients at gigabits per second. Federated learning operates under different constraints. The "data center" is a collection of edge devices on residential internet connections. Data can't move. Network bandwidth is limited. Devices go offline.

The classic example is training a keyboard prediction model on smartphones. Each phone has typing data from one user. You can't centralize this data because it's private and massive. But you want a model that learns from everyone's typing patterns. Federated learning solves this by training locally on each phone, sending only gradient updates to a central server, and aggregating those updates into a global model.

For LLMs, the problem is even harder. A 7B parameter model has 14GB of weights. Sending full model updates over the internet is impractical. This is where LoRA comes in.

## LoRA: Compressing the Updates

LoRA (Low-Rank Adaptation) is a fine-tuning technique that freezes the base model and adds small trainable "adapter" matrices. Instead of updating all 7 billion parameters, you train two small rank matrices that get multiplied together to produce a low-rank update to the original weights.

For a matrix `W` of shape `(d, k)`, LoRA introduces matrices `A` of shape `(d, r)` and `B` of shape `(r, k)`, where `r` is the rank (typically 8 or 16). The adapted weight becomes `W + AB`. Training only `A` and `B` means you're optimizing maybe 10 million parameters instead of 7 billion.

In federated learning, this is huge. Instead of transmitting 14GB of weights, clients send ~10MB of LoRA adapters. That's a 1400x reduction in communication. On a typical home internet connection (10 Mbps upload), sending LoRA adapters takes seconds instead of hours.

## Architecture: Client and Server

The system has two components: clients and a server. Clients are edge devices (in my case, a Mac and a Windows PC) that each have their own private dataset. The server is a coordinator that doesn't see data but orchestrates training rounds.

### The Client

Each client implements a Flower `Client` that defines three methods: `get_parameters()` returns the current LoRA weights, `fit()` trains locally and returns updated weights, and `evaluate()` computes metrics on a held-out test set.

Training happens in epochs. The client loads the base model (Llama-3-8B), attaches LoRA adapters, and fine-tunes on its local data using standard PyTorch training loops. After training, it extracts the LoRA adapter weights and sends them to the server. The base model weights never move.

The tricky part is handling heterogeneous hardware. The Mac uses Apple Silicon with MPS (Metal Performance Shaders). The Windows machine uses CUDA. PyTorch's device abstractions mostly handle this, but there are edge cases. For example, BitsAndBytes (a quantization library) doesn't support MPS, so I use native FP16 training instead of 4-bit quantization on Mac.

### The Server

The server runs a Flower `Server` with a custom aggregation strategy. The default strategy is Federated Averaging (FedAvg), which simply averages the weights from all clients. This works but ignores an important detail: clients have different dataset sizes.

If Client A has 1000 training examples and Client B has 100, their updates shouldn't be weighted equally. I implemented a weighted average where each client's contribution is proportional to the number of examples they trained on. The server receives not just weights but also the training set size, and computes a weighted average:

```python
total_examples = sum(client.num_examples for client in clients)
aggregated_weights = sum(
    client.weights * (client.num_examples / total_examples)
    for client in clients
)
```

This is a small change but matters when clients have skewed data distributions.

## Checkpoint Management

Federated learning runs over multiple rounds. Each round involves clients downloading the current global model, training locally, and uploading updates. If a client crashes mid-training or the server goes down, you lose progress.

I added checkpoint management that saves the server state (global model weights, round number, and client metrics) after each round. If training is interrupted, you can resume from the last checkpoint instead of starting over. This is critical for long-running experiments where interruptions are inevitable.

Checkpoints are saved with a simple naming scheme: `checkpoint_round_{round_num}.pkl`. The server loads the most recent checkpoint on startup and continues from there.

## Metrics and Evaluation

The challenge in federated learning is knowing if training is actually working. In standard training, you watch the loss curve decrease. In federated learning, each client has its own loss curve, and they can diverge wildly if clients have different data distributions.

I track three metrics: training loss per client, evaluation perplexity per client, and global evaluation perplexity on a held-out test set. Perplexity is the standard metric for language models (lower is better). It measures how "surprised" the model is by the test data.

After each round, the server aggregates client metrics and logs them to Weights & Biases. This gives visibility into which clients are learning and which are stuck. In practice, I saw perplexity decrease from ~40 to ~25 over 5 rounds, indicating the model was successfully learning from distributed data.

## Communication Efficiency

The promise of federated learning is privacy, but the cost is communication. Even with LoRA, transmitting 10MB per client per round adds up. With 10 clients and 100 rounds, that's 10GB of uploads.

I experimented with gradient compression techniques. The simplest is quantization: convert FP32 weights to FP16 or INT8 before transmission. This halves or quarters the payload size with minimal accuracy loss. I settled on FP16 because it's natively supported by PyTorch and doesn't require custom serialization.

Another optimization is sparse updates. LoRA matrices are already low-rank, but you can prune them further by zeroing out small values and only transmitting non-zero entries. I didn't implement this because the gains were small (maybe 20% reduction) and the complexity wasn't worth it.

## Failure Modes

Federated learning is fragile. Clients go offline, networks drop packets, and devices run out of memory. The system needs to handle these gracefully.

I added timeout handling. If a client doesn't respond within 60 seconds, the server marks it as unavailable and continues without it. The round completes with however many clients responded. This means some rounds have fewer participants, but training doesn't stall.

Memory issues are harder. Training a 7B model with LoRA still requires ~16GB of VRAM. If a client doesn't have enough memory, training crashes. I added gradient checkpointing (trading compute for memory) and reduced batch sizes, but ultimately, federated learning requires clients with adequate hardware.

## When Federated Learning Makes Sense

Federated learning is expensive. It's slower than centralized training, requires more engineering, and introduces failure modes. You shouldn't use it unless you actually need it.

The canonical use case is when data can't leave its source due to privacy regulations, legal constraints, or physical impossibility. Medical data, financial records, and user-generated content on edge devices are good examples.

Another use case is when data is geographically distributed and moving it is impractical. Training on security camera footage across a chain of retail stores, for instance. You could centralize the data, but the bandwidth cost is prohibitive.

If you can centralize data without legal or practical issues, just do that. Centralized training is simpler, faster, and more debuggable.

## The Real Tradeoff

Federated learning is fundamentally a trade-off: privacy for complexity. You get data sovereignty and regulatory compliance. You pay with slower training, more engineering, and harder debugging.

The engineering lesson is that distribution adds overhead. Every network hop introduces latency. Every additional failure mode requires handling code. The math of federated averaging is straightforward. Making it work in production with real devices, real networks, and real failures is the hard part.

If you're building this, start simple. Use existing frameworks like Flower rather than rolling your own. Use LoRA or other parameter-efficient methods to minimize communication. Add checkpointing and monitoring early because debugging distributed systems is hard. And most importantly, make sure you actually need federated learning before committing to the complexity.

Repository: [github.com/nnigam96/distributed-llm-lab](https://github.com/nnigam96/distributed-llm-lab)
