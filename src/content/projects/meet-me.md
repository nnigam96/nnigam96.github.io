---
# ALIGNMENT METADATA
project_id: "meet-me-digital-twin"
status: "production"
visibility: "public"
repo_link: "https://github.com/nnigam96/meet-me"
metrics_verified: true
data_source: "Live_System_Logs"

# CORE PROJECT DATA
title: "Meet-Me: The Digital Twin"
year: "2025"
description: "An agentic RAG-based personal interface bridging the gap between static resumes and technical deep-dives."
tags: ["FastAPI", "Qdrant", "Groq", "Astro", "RAG", "AgenticWorkflow"]
stack_category: ["MLOps & Infrastructure", "Natural Language Processing", "Backend Engineering"]

# VERIFIED PERFORMANCE METRICS
metrics:
  - value: "<400ms"
    label: "TTFT (Time To First Token)"
    confidence: "verified"
  - value: "98%"
    label: "Retrieval Accuracy (Ground Truth)"
    confidence: "high"
  - value: "5/min"
    label: "Rate Limit (SlowAPI)"
    confidence: "enforced"

# RETRIEVAL HOOKS (Semantic Anchors)
retrieval_hooks:
  - "How to build a low-latency RAG system with Groq LPUs"
  - "Implementing zero-hallucination guardrails in agentic workflows"
  - "Architecting a secure FastAPI backend with X-API-KEY handshakes"
  - "Developing a terminal-inspired UI for real-time token streaming"
featured: true
order: 0
---

## The Challenge
Professional portfolios are traditionally static, failing to capture the nuance of a Senior MLE's decision-making process. I needed a way to provide technical recruiters and collaborators with an **interactive, authoritative source of truth** that could explain my architectural choices without manual intervention.

## The Solution
I engineered **Meet-Me**, a localized RAG kernel that serves as my Digital Twin.



1.  **Contextual Brain (Vault Ingestion):** The system indexes a curated Obsidian vault using **Qdrant** for vector storage. It leverages hierarchical tagging (Parent Categories + Retrieval Hooks) to ensure precise categorical alignment.
2.  **Inference Engine (Groq LPU):** To achieve sub-second responsiveness, I utilized **Groq's Llama-3.3-70B** models, optimized with **prefix caching** of static resume data.
3.  **Security & Rate Management:** The backend is built on **FastAPI**, featuring a robust middleware stack including **SlowAPI** for rate limiting and custom API key validation to protect inference quotas.
4.  **Terminal Interface:** The frontend is a custom **Astro** component designed with a terminal aesthetic, supporting **Async Generators** for real-time token streaming and an amber-themed high-contrast UI.

## The Impact
Meet-Me successfully bridges the gap between high-level summaries and deep-dive technical specs. It maintains a **zero-hallucination policy** through strict cosine similarity thresholding and verified metadata flags, ensuring that every claim the Twin makes is grounded in my actual project documentation.