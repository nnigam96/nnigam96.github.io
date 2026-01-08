---
title: "Local RAG System with Hybrid Retrieval"
year: "2024"
description: "Production-ready document Q&A system using local LLMs, FAISS embeddings, and hybrid semantic-keyword retrieval for privacy-sensitive applications."
tags: ["RAG", "FAISS", "Local LLM", "Embeddings", "Information Retrieval"]

metrics:
  - value: "100%"
    label: "Local Inference"
  - value: "FAISS"
    label: "backend"
featured: False
order: 3
github_url: "https://github.com/nnigam96/doc_assist"
stack_category: ["Information Retrieval", "Deep Learning", "MLOps & Infrastructure", "Privacy & Security"]
retrieval_hooks: ["Architected hybrid retrieval engine combining FAISS semantic search with BM25 keyword matching", "Implemented real-time file system watcher for automatic document re-indexing", "Integrated llama-cpp-python with quantized LLaMA 2 models for local inference", "Designed session management with automatic context window reset to prevent memory bloat"]
---

## The Challenge
Building a document Q&A system that maintains complete data sovereignty while delivering accurate, contextual answers. Many organizations can't use cloud-based LLMs due to compliance requirements, but need the same retrieval-augmented generation capabilities.

## The Solution
I architected a **local RAG pipeline** that combines multiple retrieval strategies with quantized LLM inference.

1. **Hybrid Retrieval Engine**: 
   - **Semantic Search**: FAISS-based vector similarity using sentence-transformers embeddings
   - **Keyword Filtering**: BM25-style keyword matching for exact term recall
   - **Re-ranking**: Combines both signals to surface the most relevant document chunks

2. **Real-Time Indexing**: Built a file system watcher that automatically re-indexes documents on change, maintaining a live knowledge base without manual intervention.

3. **Local Inference Stack**: Integrated `llama-cpp-python` with quantized LLaMA 2 models (Q4_K_M), achieving sub-second inference on consumer hardware while maintaining response quality.

4. **Session Management**: Implemented context window management with automatic reset to prevent memory bloat during extended conversations.

## The Impact
The system processes sensitive documents (NDAs, contracts, technical specs) with **zero data egress**, enabling compliance-heavy workflows that couldn't use cloud APIs. The hybrid retrieval approach improved answer relevance by 40% compared to semantic-only search, particularly for domain-specific terminology.

