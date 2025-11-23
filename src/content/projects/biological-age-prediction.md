---
title: "Biological Age Prediction from Medical Imaging"
year: "2023"
description: "Multi-modal healthcare ML system predicting biological age and mortality risk from CT imaging and clinical variables using neural networks."
tags: ["PyTorch", "Healthcare ML", "Multi-Modal Learning", "Medical Imaging", "Predictive Modeling"]
metric_value: "Multi-Modal"
metric_label: "CT + Clinical Data"
featured: false
order: 0
highlights:
  - value: "CT Scans"
    label: "IMAGING"
    text: "Opportunistic cardiometabolic screening data"
  - value: "Clinical"
    label: "VARIABLES"
    text: "Demographics, lab values, health metrics"
  - value: "Outcomes"
    label: "PREDICTIONS"
    text: "Biological age, mortality risk, health endpoints"
---

## The Challenge

Chronological age doesn't reflect an individual's true physiological state. **Biological age**—how "old" a person's body functions—can differ significantly and is a better predictor of health outcomes. Building accurate predictive models requires integrating multiple data modalities: medical imaging, clinical variables, and patient demographics.

## The Solution

I developed a **multi-modal healthcare ML system** that combines imaging and clinical data:

1. **Multi-Modal Input Integration**:
   - **CT Imaging Features**: Extracted from Opportunistic Cardiometabolic Screening scans
   - **Clinical Variables**: Patient demographics, lab values, and health metrics
   - **Fusion Architecture**: Neural networks that learn joint representations from both modalities

2. **Multiple Prediction Tasks**:
   - **Biological Age Regression**: Predicting physiological age from multi-modal inputs
   - **Mortality Risk Classification**: Forecasting death outcomes for risk stratification
   - **Additional Medical Outcomes**: Extensible framework for other healthcare predictions

3. **Production ML Practices**:
   - Proper data preprocessing and normalization for medical data
   - Train/validation/test splits with appropriate stratification
   - Model checkpointing and evaluation metrics

## The Impact

This project demonstrates the full ML lifecycle for healthcare applications: handling sensitive medical data, integrating multiple modalities, and building models that can inform clinical decision-making. The multi-modal approach significantly outperforms single-modality baselines, showcasing the importance of combining imaging and clinical data for accurate health predictions—essential skills for ML engineers working in healthcare technology.

