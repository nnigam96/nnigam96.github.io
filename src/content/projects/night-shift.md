---
title: "Night Shift – Local Agentic Recruiter Outreach"
year: "2025"
description: "Local-first, privacy-preserving agentic workflow that triages historical recruiter communication, runs retrieval, and drafts responses without data egress."
tags: ["LangGraph", "Ollama", "RAG", "Agentic AI", "Privacy"]
metrics:
  - value: "27k+"
    label: "Emails Parsed"
  - value: "<15s"
    label: "Draft Latency"
  - value: "0"
    label: "Cloud Calls"
homepage_metric_index: 1
featured: false
order: 8
github_url: "https://github.com/nnigam96/night-shift"
---

> **Status:** Under active development. The initial skeleton already runs end-to-end on Apple Silicon; the public dashboard is being polished.

## The Problem
Recruiting inboxes accumulate **years of outreach** that mixes genuine opportunities with automated blasts. Traditional tooling requires exporting data to SaaS platforms, breaking privacy promises and making iteration slow. I wanted a local workflow where inference, embeddings, and storage never leave my laptop yet still act autonomously.

## System Architecture
Night Shift follows a Lambda-style design:

1. **Batch Layer (Cold Start)** – Imports `.mbox` exports (~27k emails) and passes them through a janitor pipeline that strips signatures, HTML cruft, and disclaimers before vectorization.
2. **Speed Layer (Live Sync)** – An Azure AD public client (scoped to `Mail.Read`) fetches incremental updates behind enterprise firewalls and keeps drafts in sync.
3. **Agentic Brain (LangGraph)** – Replaces brittle sequential chains with an asynchronous state machine:
   - **Classifier Gatekeeper** – Quantized Llama 3.1 JSON mode separates genuine intent from spam.
   - **Historian** – Local FAISS store recalls previous dialogs with the same firm or recruiter.
   - **Drafter** – Synthesizes a reply using the candidate resume, recruiter context, and retrieved history.
4. **Human-in-the-Loop UI** – Streamlit dashboard surfaces drafts for one-click approval or manual edits before anything is sent.

## Local Stack
| Layer | Tech | Why |
| --- | --- | --- |
| Compute | Ollama (Llama 3.1, nomic-embed-text) | On-device inference eliminates API cost and keeps PII local. |
| Orchestration | LangGraph | Explicit state + interrupts prevent runaway chains and enable partial retries. |
| Storage | FAISS + SQLite | Fast enough for <100k vectors, no cloud dependencies. |
| Ingestion | Native Python parsers | Direct `.mbox` access bypasses throttled APIs and corporate controls. |

## Flow
1. `python -m src.ingest_local` cleans and stages historical mailboxes.  
2. `python -m src.vectorize` builds embeddings into a git-ignored FAISS index.  
3. `streamlit run interface/dashboard.py` launches the reviewer surface (currently in progress).  

All components run on Apple Silicon with 4-bit quantization; end-to-end draft generation completes **in under 15 seconds**.

## Security Posture
- **Zero Data Exfiltration:** No cloud inference, no third-party storage.  
- **Scoped OAuth:** The Azure client only reads mail and drafts.  
- **Local Secrets:** `.env` holds runtime credentials; `data/` remains git-ignored.

## Roadmap
- [ ] Surface per-company histories directly inside the Streamlit UI.  
- [ ] Add “auto-send” with configurable guardrails.  
- [ ] Package the ingest/vectorize steps as reusable CLI commands.

---

**Repository:** [github.com/nnigam96/night-shift](https://github.com/nnigam96/night-shift)

