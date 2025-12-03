---
title: "Distributed LLM Systems Lab"
year: "2025"
description: "Production-grade monorepo for distributed large language model systems: federated learning, speculative decoding, split inference, and distributed training."
tags: ["PyTorch", "Distributed Systems", "LLMs", "System Design", "Research"]
metrics:
  - value: "82%"
    label: "Draft Alignment"       # Focus: Probability & Model Distillation
  - value: "O(1)"
    label: "Attention Complexity"
featured: true

order: 7
homepage_metric_index: 0
github_url: "https://github.com/nnigam96/distributed-llm-lab"
---

## Status: Under Active Development

This project is a comprehensive research and engineering lab exploring distributed LLM architectures. The codebase adheres to strict production engineering standards while pushing the boundaries of what's possible with distributed model execution.

## Engineering Philosophy

**"We are not writing scripts. We are engineering systems."**

The codebase enforces:
- **Strict Typing**: Strict configuration management using Hydra Structured Configs and comprehensive Python type hinting.
- **Config-Driven**: All configuration managed through Hydra (.yaml files), zero hardcoded values
- **Observability**: Comprehensive metrics and logging via Weights & Biases
- **High-Performance Networking**: Raw TCP sockets with binary protocol (struct packing) for minimal latency

## The Four Pillars

### 1. Federated Learning ("The Privacy Vault")

**Philosophy**: "Data gravity is real. Move the compute to the data."

Implements Federated Averaging (FedAvg) where a central coordinator aggregates LoRA adapter updates from edge nodes without ever seeing raw training data. Uses PEFT (Parameter-Efficient Fine-Tuning) to transmit only rank matrices (~10MB) instead of full 7B weights (14GB). Custom weighted aggregation strategy that weights by dataset size, not just averaging.

**Key Components**:
- `LoRAClient` with 4-bit quantization and LoRA adapters
- `WeightedFedAvg` - custom aggregation weighted by dataset size
- Automatic device detection (Apple Silicon MPS or CUDA)

### 2. Speculative Decoding ("The Speed Demon")

**Philosophy**: "Latency is the sum of compute time + transmission time. Minimize both."

Implements speculative sampling where a "Draft Model" (Mac) produces token candidates cheaply, and the "Target Model" (Windows) verifies them in parallel. Uses raw TCP sockets with struct packing for minimal latency—HTTP. Implemented a custom Producer-Consumer protocol using non-blocking socket patterns and TCP_NODELAY to minimize round-trip latency.

**Key Components**:
- Binary packet structure with `send_msg()`, `recv_msg()`, `send_tokens()`, `recv_tokens()`
- Drafter: Tight loop running `model.generate(max_new_tokens=5)`
- Verifier: Single forward pass verification with cross-entropy comparison

**Metrics**: Wall-clock speedup (Total Time / Total Tokens), Alpha (Acceptance Rate)

### 3. Split Inference (In Progress) ("The Heavy Lifter")

**Philosophy**: "VRAM is a hard constraint. Network bandwidth is a soft constraint. Trade one for the other."

Enables running models larger than the VRAM of a single device (e.g., Llama-70B on 24GB VRAM). Slices the neural network graph at a specific layer, placing layers 0...n on Device A and n...end on Device B. Uses `torch.distributed.rpc` for distributed model execution.

**Key Components**:
- `Shard1`: Embedding + first N layers (MPS/Mac)
- `Shard2`: Remaining layers + LM Head (CUDA/Windows)
- `ShardedModel`: Wrapper with RPC references
- Intermediate activations moved to CPU before RPC transmission, then back to GPU

**Metrics**: Inference latency per token, VRAM utilization per node

### 4. Split Training (In Progress) ("The Moonshot")

**Philosophy**: "Gradient descent is just chain rule. The chain rule doesn't care if the variables are on different continents."

Enables backpropagation across the network split defined in Split Inference. Uses `torch.distributed.autograd` to track the computation graph across RPC boundaries. Implements distributed optimizer that updates weights on both machines.

**Key Components**:
- `DistributedTrainer`: Main training loop with autograd context lifecycle
- `train_step()`: Forward pass, loss computation, backward pass, optimizer step
- Distributed Autograd Context: Tracks gradients across RPC boundaries
- Gradient flow: Loss computed on Windows, gradients flow back to Mac through RPC

**Metrics**: Training loss decrease to verify gradients crossing the network boundary

## Architecture Highlights

**Network Protocol**: Raw TCP sockets with binary protocol
- Request: `[Header: 4 bytes len] + [Payload: UTF-8 string]`
- Response: `[Header: 4 bytes count] + [Payload: Array of Int32]`

**Configuration Management**: Hydra-based config system
- Main config (IPs, Ports)
- Model-specific configs (TinyLlama, Llama-3)
- Project-specific overrides (spec_decoding, fed_learn, split_inf)

**Code Quality**: Production-grade standards
- Comprehensive type hints with Hydra Structured Configs
- Memory efficiency and low latency design
- Proper data flow and scalability
- Makefile targets for format, lint, test

**Automated Forensic Analysis**:
Includes a custom orchestration engine (`run_matrix.py`) that performs grid searches across hardware configurations (Context Window vs. Batch Size), automatically visualizing trade-offs via Seaborn heatmaps.

## Technical Stack

- **Frameworks**: PyTorch, torch.distributed (RPC, Autograd)
- **Networking**: Raw TCP sockets, struct packing, asyncio
- **Configuration**: Hydra
- **Observability**: Weights & Biases
- **Type Safety**: Hydra Structured Configs, comprehensive type hints
- **Device Support**: Apple Silicon (MPS), CUDA, automatic detection

## Current Status

This project is under active development. The architecture is designed for production-grade reliability while exploring cutting-edge distributed ML techniques. Each sub-project is independently runnable and can be benchmarked separately.

**Repository**: [github.com/nnigam96/distributed-llm-lab](https://github.com/nnigam96/distributed-llm-lab)

