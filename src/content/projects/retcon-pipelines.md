---
title: "Historical Backfill Pipeline"
year: "2023"
description: "Large-scale migration job for regenerating and re-hosting ML artifacts from legacy experiment runs."
tags: ["MLOps", "MLflow", "W&B"]
metrics:
  - value: ">1k"
    label: "ML experiments"
  - value: "100%"
    label: "No dataloss in migration"
featured: false
order: 6
---

## The Challenge
We migrated our experiment tracking stack to a new architecture, but we had hundreds of valuable historical runs locked in legacy systems (Weights & Biases) without the metadata required for our new Vector Search system or the artifacts needed for reproducibility.

## The Solution
I built a **Retroactive Continuity ('Retcon') Pipeline** that behaved like a migration job for ML artifacts:
* **Extraction:** developed crawlers to systematically pull checkpoints, metrics, and configs from W&B histories.
* **Enrichment:** A batch processing engine that rehydrated models, ran them through our modern feature extraction pipeline, and generated missing metadata.
* **Unification:** Re-ingested the enriched artifacts into MLflow with full lineage, creating a single source of truth ready for downstream search and recommendations.

## The Impact
Allowed us to launch the new Recommendation System with a fully populated database on Day 1, leveraging years of historical R&D data that would otherwise have been discarded.