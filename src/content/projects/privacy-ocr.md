---
title: "Privacy-First OCR Pipeline"
year: "2024"
description: "Hybrid compliance workflow using local Ollama models and EasyOCR."
tags: ["Ollama", "Local LLM", "Privacy", "Computer Vision"]
metric_value: "100%"
metric_label: "Local Inference"
featured: true
order: 3
---

## The Challenge
A partner in a compliance-heavy industry needed to extract structured data from physical ID cards and documents. However, sending sensitive PII (Personally Identifiable Information) to cloud-based LLM APIs posed unacceptable privacy risks.

## The Solution
I built a **Hybrid OCR Pipeline** designed to run entirely on the edge:

* **Vision Layer:** Utilized robust open-source OCR engines for text detection and extraction.
* **Reasoning Layer:** Deployed quantized local LLMs (via **Ollama**) to clean, parse, and structure the messy OCR output into valid JSON.
* **Orchestration:** Layered a custom agent to provide grounded reasoning about the document content (e.g., verifying coverage dates) without data egress.

## The Impact
Achieved **100% data sovereignty**. No raw images or text leave the local environment during the extraction process, satisfying strict regulatory requirements while automating manual data entry.