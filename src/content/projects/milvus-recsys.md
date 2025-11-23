---
title: "Intelligent Model Recommendation"
year: "2024"
description: "Sub-second recommendation engine analyzing high-dimensional meta-features via Milvus."
tags: ["PyTorch", "Milvus", "RecSys", "System Design"]
metric_value: "5x"
metric_label: "Catalog Expansion"
featured: true
order: 1
---

## The Challenge
As our experiment catalog grew, standard query methods became a bottleneck. We needed to analyze hundreds of **meta-features** (dataset characteristics + model architecture stats) to recommend the optimal model for a user's specific task. Latency was degrading, and we needed a way to isolate client data logically without managing separate physical clusters for every tenant.

## The Solution
I engineered a **Vector Search System** using **Milvus** as the core engine.

1.  **Fingerprinting Pipeline:** Built an automated pipeline to convert arbitrary DataLoaders and Model Graphs into dense vector representations.
2.  **Two-Stage Retrieval:** 
    * **Stage 1 (ANN):** Rapid approximate nearest neighbor search to funnel down the search space
    * **Stage 2 (Re-ranking):** A fine-grained statistical scoring layer to select the highest-performing candidate based on historical performance metrics.
3.  **Logical Isolation:** Implemented a partition strategy that routes queries to client-specific shards, ensuring data privacy while maintaining a shared infrastructure.

## The Impact
The system achieved **sub-second retrieval latency** (< 800ms) while handling a **5x expansion** in the experiment catalog. It now serves as the backbone for the automated modeling workflow, allowing users to receive architecture recommendations instantly.