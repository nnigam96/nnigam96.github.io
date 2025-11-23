---
title: "Medical Imaging Denoising Pipeline"
year: "2023"
description: "Production-grade 3D UNet architecture for MRI denoising using MONAI, with HPC training infrastructure and comprehensive evaluation pipelines."
tags: ["PyTorch", "MONAI", "Medical Imaging", "3D CNNs", "HPC"]
metric_value: "3D"
metric_label: "Volumetric Processing"
featured: false
order: 0
highlights:
  - value: "3D UNet"
    label: "ARCHITECTURE"
    text: "Full volumetric context for superior denoising"
  - value: "MONAI"
    label: "FRAMEWORK"
    text: "Production medical imaging infrastructure"
  - value: "HPC"
    label: "INFRASTRUCTURE"
    text: "SLURM cluster training with checkpointing"
---

## The Challenge

MRI scans are inherently noisy due to physical acquisition constraints, motion artifacts, and thermal noise. Traditional denoising methods often blur critical anatomical details, making them unsuitable for clinical diagnosis and downstream analysis tasks like segmentation and registration.

## The Solution

I developed a **comprehensive denoising pipeline** using 3D UNet architectures optimized for medical imaging workflows:

1. **3D Volumetric Processing**: Unlike 2D slice-based approaches, the 3D UNet processes entire volumes, capturing spatial context across all dimensions for superior denoising quality.

2. **MONAI Integration**: Leveraged MONAI's medical imaging transforms, data loaders, and model architectures to build a production-ready pipeline with proper NIfTI handling, intensity normalization, and medical imaging-specific augmentations.

3. **HPC Training Infrastructure**: Built SLURM submission scripts for cluster-based training, enabling efficient multi-GPU training with automatic checkpointing and resumption capabilities.

4. **Comprehensive Evaluation**: Implemented quantitative metrics (PSNR, SSIM) alongside visual quality assessment to validate denoising performance while preserving anatomical structures.

## The Impact

The pipeline demonstrates production ML engineering for medical imaging: proper data handling, scalable training infrastructure, and rigorous evaluation. The 3D approach significantly outperforms 2D methods by leveraging full spatial context, making it suitable for clinical research applications where image quality directly impacts diagnostic accuracy.

