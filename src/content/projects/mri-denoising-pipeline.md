---
title: "Generative MRI Restoration"
year: "2023"
description: "Adapting Stable Diffusion to replace slow, iterative MRI correction with real-time generative inference."
tags: ["GenAI", "Stable Diffusion", "Medical Imaging", "Research"]
featured: true
order: 5
metrics:
  - value: "68%"
    label: "Error Reduction"
  - value: "1.7x"
    label: "Signal Clarity"
github_url: "https://github.com/nnigam96/MRI_Denoising"
homepage_metric_index: 0
stack_category: ["Deep Learning", "Computer Vision", "Medical Imaging", "Generative AI"]
retrieval_hooks: ["Engineered latent diffusion pipeline treating MRI correction as single-pass generative task", "Implemented N4-guided conditioning signal for preserving medical accuracy in denoising", "Designed custom noise scheduler preventing hallucination of fine anatomical details", "Generated synthetic training data simulating RF coil physics for real-world hardware artifacts"]
---



## The Challenge
Magnetic Resonance Imaging (MRI) diagnostic quality is often bottlenecked by hardware limitations, specifically **Rician Noise** and **Bias Fields** (intensity inhomogeneities).

Standard solutions like **N4ITK** rely on slow, iterative CPU algorithms to correct these errors one by one. I investigated if **Generative AI** could act as a "software upgrade" for older scanners, solving both problems instantly.

## The Solution
I engineered a **Latent Diffusion Pipeline** that treats MRI correction as a single-pass generative task rather than an iterative optimization problem.

* **N4-Guided Conditioning:** Engineered a conditioning signal that guides the diffusion model to "see" the clean anatomy through the noise, ensuring medical accuracy is preserved.
* **Modified Noise Scheduler:** Implemented a custom noise envelope that prevents the model from hallucinating or blurring fine anatomical details—a common failure mode in standard Stable Diffusion.
* **Physics-Based Training:** Generated synthetic training data that simulates the actual RF coil physics of MRI scanners, ensuring the model works on real-world hardware artifacts.

## The Impact
* **Quality:** Achieved a **68% reduction in structural error** (SSIM) compared to industry-standard baselines, effectively rendering the images "visually identical" to ground truth.
* **Efficiency:** Converted a multi-step iterative correction process into a **single-shot inference pass**, enabling near real-time image enhancement.
* **Business Value:** Demonstrated that software-defined correction can compensate for hardware imperfections, potentially reducing the manufacturing cost of MRI receiver coils.

---

**Note:** Experiments and implementations for this project are scattered across multiple repositories:
- [MRI_Denoising](https://github.com/nnigam96/MRI_Denoising) - Main repository (2D/3D implementations)
- [nn_MONAI](https://github.com/nnigam96/nn_MONAI) - MONAI-based 3D UNet experiments for volumetric denoising
- [DDM2](https://github.com/nnigam96/DDM2) - Self-supervised diffusion model for MRI denoising (custom modifications)
- [SupervisedDiffusion](https://github.com/nnigam96/SupervisedDiffusion) - Supervised diffusion models for paired noisy-clean MRI data
- [MRI_Denoising_Old](https://github.com/nnigam96/MRI_Denoising_Old) - Legacy PyTorch Lightning implementation with UNet architectures
