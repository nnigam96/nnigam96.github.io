---
title: "LLM Router: High-Performance Semantic Orchestration"
year: "2025"
description: "A forensic laboratory for optimizing latency vs semantics in distributed LLM systems with hybrid routing and DPO-based continuous improvement."
tags: ["Python", "LLMs", "FastAPI", "System Design", "Performance"]
stack_category: ["System Design", "Deep Learning", "MLOps & Infrastructure", "Backend Engineering"]

metrics:
  - value: "<50ms"
    label: "Routing Overhead"
  - value: "L1→L2"
    label: "Hybrid Fallback"

github_url: "https://github.com/nnigam96/llm-router"
retrieval_hooks:
  - "Implemented hybrid routing with deterministic keyword L1 and semantic vector L2 fallback"
  - "Designed protocol-oriented LLMProvider abstraction for Ollama vLLM mock endpoints"
  - "Built forensic benchmarking suite with grid search across routing thresholds"
  - "Architected DPO flywheel pipeline collecting production traffic for continuous improvement"
featured: true
order: 9
---

## The Challenge

Most LLM routing systems are just if-else wrappers around OpenAI calls. They work for demos but fail under production constraints where milliseconds matter and cost scales with every query. The problem: how do you intelligently route queries to appropriate models while keeping overhead under 50ms?

## The Solution

I built **LLM-Router**, a production-grade microservice implementing a **Hybrid Routing Architecture** that balances latency and semantic accuracy.

### Core Components

1. **L1: Keyword Router (Fast Path)**: Deterministic regex matching in `KeywordRoutingStrategy` with <1ms latency. Handles 90% of queries using pattern dictionaries loaded from Hydra configs.

2. **L2: Semantic Router (Fallback)**: When L1 fails, `SemanticRoutingStrategy` uses `all-MiniLM-L6-v2` embeddings with cosine similarity (~30ms latency). Provides intelligent routing for complex queries that don't match keyword patterns.

3. **Protocol-Oriented Design**: `RoutingStrategy` and `LLMProvider` protocols in `src/core/protocols.py` enable swappable implementations. Currently supports Ollama with asymmetric model deployment (Llama-3.2-3B for reasoning, TinyLlama for speed).

4. **Forensic Benchmarking**: `src/forensics/benchmark_suite.py` systematically tests routing decisions across model configs and query types, visualizing latency-accuracy trade-offs as heatmaps.

5. **DPO Flywheel**: `src/forensics/dpo_pipeline.py` logs routing decisions as `{prompt, chosen, rejected}` triplets, enabling Direct Preference Optimization from production traffic without a separate reward model.

## The Impact

This project demonstrates that routing doesn't need complex ML. Start with rules (keywords), add semantic fallback for edge cases, and collect data for continuous improvement. The forensic approach (measure everything, optimize bottlenecks) applies beyond LLM routing to any latency-constrained system.

**Key Insight**: Hybrid routing keeps P50 latency under 50ms while maintaining routing accuracy. The DPO flywheel creates a continuous improvement loop where better routing generates better training data.
