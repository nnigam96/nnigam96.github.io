---
title: "Industrial Data Normalization"
year: "2024"
description: "Agentic system for normalizing heterogeneous industrial datasets."
tags: ["Data Engineering", "Agents", "Python"]
metric_value: "Auto"
metric_label: "Schema Mapping"
featured: false
archived: true
order: 4
---

## The Context
An industrial partner struggled with ingesting data from diverse sources. Spreadsheets arrived with varying column names, units of measurement, and formatting standards, making manual normalization a bottleneck for analysis.

## The Solution
I built an **Agentic Data Pipeline** to automate this cleanup:
* **Deterministic Tools:** Created a library of atomic functions for unit conversion, entity matching, and QC checks.
* **Context-Aware Mapping:** The agent utilizes domain-specific context files to understand acceptable thresholds and terminologies, allowing it to map incoming data to a standardized schema intelligently.
* **Audit Trail:** Implemented a logging system that captures every transformation decision, allowing domain experts to review *why* a specific value was altered.

## The Result
The system successfully ingests inconsistent raw files and emits standardized, analysis-ready datasets, significantly reducing the lead time for data modeling.