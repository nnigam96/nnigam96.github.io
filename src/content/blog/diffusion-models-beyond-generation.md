---
title: "Diffusion Models Beyond Generation: Supervised Denoising for Medical Imaging"
date: 2024-12-10
description: "Adapting diffusion model architectures for supervised denoising tasks, exploring how generative model techniques can improve image restoration when paired training data exists."
tags: ["Diffusion Models", "Medical Imaging", "Deep Learning", "Image Restoration"]
readingTime: "6 min read"
archived: true
references:
  - label: "DDPM Paper"
    url: "https://arxiv.org/abs/2006.11239"
  - label: "MONAI Diffusion Denoising Models"
    url: "https://docs.monai.io/en/stable/overviews/diffusion_models.html"
---

## Introduction

Diffusion models have revolutionized generative AI, but their application to **supervised denoising**—where paired noisy-clean training data exists—is less explored. This post details my experiments adapting diffusion architectures for MRI denoising, where traditional UNets are the standard but diffusion models offer intriguing alternatives.

## The Supervised Denoising Problem

Unlike unconditional generation, supervised denoising has:
- **Paired Data**: Noisy input and clean target for every training example
- **Deterministic Goal**: Predict the clean image, not sample from a distribution
- **Quality Metrics**: PSNR, SSIM, and visual quality assessment

Traditional approaches use UNets trained with MSE loss. Diffusion models, designed for generation, require adaptation.

## Adapting Diffusion for Supervision

The key insight: **use diffusion architecture, but train with direct supervision**.

1. **Architecture**: Leverage diffusion model U-Nets (from Hugging Face Diffusers / MONAI) for their stable training properties
2. **Training**: Instead of learning a noise prediction task, train to directly predict clean volumes from noisy inputs
3. **Inference**: Use deterministic sampling (single-step or few-step) rather than full diffusion sampling

## Implementation Details

I adapted MONAI's diffusion denoising model (DDM) for supervised training:

- **Input**: Noisy MRI volume
- **Target**: Clean MRI volume (paired training data)
- **Loss**: MSE between predicted and target clean volumes
- **Scheduler**: Custom noise schedule optimized for medical imaging

The diffusion architecture's residual connections and attention mechanisms provide benefits even in supervised settings.

## Results and Insights

**Performance**: The supervised diffusion approach achieved comparable PSNR/SSIM to traditional UNets, with some advantages in preserving fine anatomical details.

**Training Stability**: Diffusion architectures are known for stable training—this benefit carries over to supervised tasks, especially with large 3D volumes.

**Inference Speed**: Deterministic inference (single forward pass) makes this approach practical for production, unlike full diffusion sampling which requires many steps.

## When to Use Diffusion for Denoising?

**Use diffusion architectures when**:
- You have paired training data (supervised setting)
- You want stable training on large volumetric data
- Fine detail preservation is critical

**Stick with traditional UNets when**:
- Inference latency is the primary constraint
- You need the simplest possible architecture
- Memory is extremely limited

## Broader Implications

This work demonstrates that **generative model architectures have value beyond generation**. The attention mechanisms, residual connections, and training stability of diffusion models can improve supervised tasks too.

The line between generative and discriminative models is blurring—modern architectures are flexible enough to excel in both settings.

## Conclusion

Supervised diffusion for denoising is a promising direction, especially for medical imaging where detail preservation matters. The architecture benefits (stable training, attention mechanisms) outweigh the added complexity when image quality is paramount.

For ML engineers, this highlights the value of understanding generative models even if you're building discriminative systems—the architectures and techniques transfer.

