---
title: "Building a Production RAG System: The Engineering Beyond Embeddings"
date: 2025-01-13
description: "RAG tutorials skip the hard parts. Here's what it takes to build a real system: PII masking, hallucination prevention, intent-driven retrieval, and automated evaluation frameworks."
tags: ["RAG", "Production ML", "Privacy", "System Design"]
readingTime: "10 min read"
archived: false
references:
  - label: "LangGraph Documentation"
    url: "https://langchain-ai.github.io/langgraph/"
  - label: "Microsoft Presidio"
    url: "https://microsoft.github.io/presidio/"
  - label: "Qdrant Vector Database"
    url: "https://qdrant.tech/"
stack_category: ["Information Retrieval", "MLOps & Infrastructure", "Privacy & Security", "System Design"]
retrieval_hooks: ["Built production RAG system with LangGraph state machines for workflow orchestration", "Implemented PII detection and masking using Microsoft Presidio and spaCy NER", "Designed intent-driven retrieval with category-based metadata filtering", "Created automated evaluation framework with LLM-as-judge for hallucination detection"]
---

Every RAG tutorial shows you how to embed documents and retrieve them. Load your PDFs, chunk the text, generate embeddings, store in a vector database, done. Then you realize the tutorial skipped everything that makes RAG work in production.

I built a RAG system that powers my digital portfolio assistant. Users ask questions about my work, and the system retrieves relevant context from project documentation, then generates accurate responses. It handles thousands of queries with sub-second latency and zero hallucinations (by design, not luck). Here's what the tutorials don't tell you.

## The RAG Stack Everyone Shows You

The standard tutorial architecture looks like this: chunk documents, embed them with `sentence-transformers`, store in a vector database (Pinecone, Qdrant, whatever), retrieve top-k similar chunks, stuff them into an LLM prompt, generate a response. This works for demos. It fails in production.

The problems:

**Hallucination**: LLMs make things up when the context doesn't contain an answer. Without guardrails, your system confidently states facts that aren't in your documents.

**PII leakage**: If your documents contain names, emails, or phone numbers, naive RAG will echo them back to users. This violates privacy policies and, depending on your domain, regulations like GDPR or HIPAA.

**Poor retrieval**: Semantic search retrieves documents similar to the query, not necessarily documents that answer the query. A question about "Milvus performance" might retrieve documents mentioning Milvus but not discussing performance.

**No evaluation**: You ship the system, users complain that responses are wrong, and you have no systematic way to measure or improve quality.

The engineering challenge isn't RAG itself. It's everything around RAG that makes it production-grade.

## Architecture: State Machines, Not Chains

Most RAG implementations use sequential chains: embed query, retrieve docs, generate response. This is brittle. What if you need to classify the query first? What if retrieval fails? What if the LLM refuses to answer?

I used LangGraph, which models workflows as state machines. Each node is a function that takes state, does something (scrub PII, extract intent, retrieve docs), and returns updated state. Edges define transitions between nodes. The system can branch, loop, or early-exit based on state.

The workflow looks like this:

1. **Scrub Input**: Detect and mask PII in the user query
2. **Extract Intent**: Classify the query into categories (Deep Learning, MLOps, RecSys, Backend)
3. **Build Filter**: Construct metadata filters based on the intent
4. **Retrieve Context**: Query the vector database with filters
5. **Construct Prompt**: Format retrieved chunks with source attribution
6. **Generate Response**: Call the LLM with the constructed prompt

Each step is a separate function. If PII detection fails, the system can skip scrubbing. If intent extraction returns "None," it skips filtering and does a broad search. This flexibility is hard to achieve with sequential chains.

## PII Masking: Harder Than It Looks

Users will inevitably ask questions containing their name, email, or other sensitive information. If your system parrots this back in responses or logs it for debugging, you've leaked PII.

I used Microsoft Presidio, a PII detection library built on spaCy. It recognizes entities like `PERSON`, `EMAIL_ADDRESS`, `PHONE_NUMBER`, `LOCATION`, `US_SSN`, and more. When detected, it replaces them with generic placeholders like `[PERSON]` or `[EMAIL]`.

The challenge is false positives. Presidio flagged "Python" as a location, "React" as a person, and technical terms as entities. I added a custom allowlist for common tech terms and tuned the confidence thresholds. Even with tuning, PII detection is imperfect. The trade-off is between false positives (masking valid content) and false negatives (leaking PII).

For production systems handling regulated data (healthcare, finance), you need PII masking. For internal tools, you might skip it. Know your threat model.

## Intent-Driven Retrieval

Semantic search alone is bad at retrieval. Embedding similarity measures surface-level similarity, not relevance. A query about "distributed training" retrieves documents containing those words, even if they're about distributed systems, not training.

I added intent extraction. Before retrieval, the system classifies the query into one of four categories: Deep Learning, MLOps, Recommendation Systems, or Backend Engineering. This uses a small LLM (llama-3.1-8b-instant) with a structured prompt that returns just the category label.

The category becomes a metadata filter. Documents in my vector database are tagged with categories during ingestion. When retrieving, the system filters to only documents matching the extracted category. This drastically improves precision. A question about "vector search in recommendation systems" retrieves RecSys docs, not generic vector database tutorials.

Intent extraction adds 300ms of latency (one additional LLM call). For my use case, the accuracy improvement is worth it. For latency-sensitive applications, you might skip it or use a smaller/faster model.

## Hallucination Prevention: Metadata and Thresholds

LLMs hallucinate. Give them a query outside their context, and they'll generate a plausible-sounding answer that's completely made up. For RAG, this is unacceptable. Users trust responses because they're "grounded in your documents."

I added two layers of defense:

**Similarity Thresholds**: Retrieved chunks must have a similarity score above 0.0 (basic sanity check). If no chunks meet the threshold, the system returns "I don't have enough information to answer that" instead of generating a response.

**Verified Metrics Flag**: Documents in my system are tagged with `metrics_verified: true` or `false`. When generating responses, the prompt explicitly warns the LLM: "Do not cite unverified metrics as fact." This prevents the system from confidently stating performance numbers that haven't been validated.

Neither of these is perfect. The LLM can still hallucinate within the retrieved context, and similarity thresholds are hard to tune (too high = no results, too low = irrelevant results). But they reduce hallucination from "frequent" to "rare."

The real solution is to not trust the LLM. For high-stakes applications, you need human review loops, not just automated guardrails.

## Evaluation: LLM-as-Judge

You can't improve what you don't measure. I built an evaluation framework with 12 test cases covering:

**Technical Depth**: Questions requiring precise technical knowledge ("What indexing strategy did you use in Milvus?")

**Hallucination Traps**: Queries designed to elicit false information ("Did you work at Google?", "What was your role at Tesla?")

**Verified Metrics**: Questions about performance numbers that should cite sources

**Negative Cases**: Questions the system should refuse to answer because the information doesn't exist in the context

Each test case has an expected answer or behavior. The evaluation script runs all queries, sends responses to an LLM judge (Groq llama-3.3-70b), and scores them on:

**Accuracy (1-5)**: Is the information correct?

**Hallucination Score (1-5)**: Did the system make things up? (5 = no hallucinations)

**Alignment Score (1-5)**: Did it use the correct metadata filters?

The LLM-as-judge approach isn't perfect (LLMs judging LLM outputs has its own biases), but it's better than manual review and lets you iterate quickly. I run evaluations after every major change to catch regressions.

## Latency Breakdown

The system targets sub-second response time. Here's where time goes:

- **PII Masking**: ~50ms (spaCy NER is fast)
- **Intent Extraction**: ~300ms (one LLM call)
- **Vector Search**: ~50ms (Qdrant is fast, local deployment)
- **LLM Generation**: ~1000ms (Groq llama-3.3-70b, depends on output length)

Total: ~1.4 seconds from query to first token. The bottleneck is LLM generation. Using a smaller model (llama-3.1-8b) cuts this to ~600ms but reduces answer quality. Using streaming (return tokens as they're generated) makes the perceived latency lower.

For most use cases, 1-2 second latency is acceptable. For interactive chat, streaming is mandatory. For batch processing, latency doesn't matter.

## Deployment: API + Web UI

The system has two interfaces: a FastAPI REST API and a Chainlit web UI.

The **API** handles authentication (API key in header), rate limiting (5 requests/min via SlowAPI), CORS for allowed origins, and returns JSON responses. It's stateless and horizontally scalable.

The **Web UI** uses Chainlit, a streaming chat interface. It connects to the same backend but adds session management and markdown rendering. Users get real-time token streaming, making long responses feel faster.

Both interfaces share the same core RAG engine (implemented as a Python class). This separation lets me A/B test changes to the UI without touching the backend logic.

## What This Doesn't Cover

Production RAG has more moving parts I didn't implement yet:

**Conversation Memory**: My system is stateless. Each query is independent. For multi-turn conversations, you need context tracking and history management.

**Re-ranking**: After vector retrieval, re-rank results using a cross-encoder for better precision. This adds latency but improves quality.

**Hybrid Search**: Combine semantic search with keyword search (BM25) for better recall on exact matches.

**Caching**: Cache responses for common queries to reduce LLM costs and latency.

These are valuable but not mandatory for an MVP. Start simple, measure what matters, optimize the bottlenecks.

## The Real Lesson

RAG isn't hard because embeddings are hard. It's hard because production systems require guardrails, evaluation, monitoring, and handling edge cases. The algorithm is 10% of the work. The engineering is 90%.

If you're building RAG, spend time on:

**Guardrails**: PII masking, hallucination detection, content filtering

**Evaluation**: Automated test suites, LLM-as-judge, regression detection

**Retrieval Quality**: Intent extraction, metadata filters, similarity thresholds

**Observability**: Logging, metrics, traces to debug issues in production

The tutorials give you the algorithm. The engineering makes it work for real users.

Repository: [github.com/nnigam96/meet-me](https://github.com/nnigam96/meet-me)
