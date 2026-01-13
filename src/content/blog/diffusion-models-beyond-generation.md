---
title: "Diffusion Models Beyond Generation: Supervised Denoising for Medical Imaging"
date: 2025-01-13
description: "Why I used generative model architectures for a supervised task. Adapting diffusion models for MRI denoising with paired data, custom noise schedules, and single-step inference."
tags: ["Diffusion Models", "Medical Imaging", "Deep Learning", "Computer Vision"]
readingTime: "9 min read"
archived: false
references:
  - label: "DDPM Paper"
    url: "https://arxiv.org/abs/2006.11239"
  - label: "MONAI Diffusion Denoising Models"
    url: "https://docs.monai.io/en/stable/overviews/diffusion_models.html"
  - label: "DDM² Self-Supervised Diffusion"
    url: "https://arxiv.org/abs/2302.03018"
stack_category: ["Deep Learning", "Generative AI", "Medical Imaging", "Computer Vision"]
retrieval_hooks: ["Adapted MONAI diffusion architectures for supervised MRI denoising with paired training data", "Implemented deterministic single-step inference eliminating multi-step sampling overhead", "Designed custom noise schedules preventing hallucination of anatomical details", "Built three-stage pipeline for noise modeling state matching and denoising"]
---

Diffusion models dominated image generation in 2023. Stable Diffusion, DALL-E, Midjourney all use the same underlying math: gradually add noise to data, then learn to reverse the process. The result is photorealistic image generation from text prompts. But what if you use diffusion architectures for something they weren't designed for?

I spent several months adapting diffusion models for supervised denoising of MRI scans. This is the opposite of generation. I have paired training data (noisy input, clean target) and a deterministic goal (predict the exact clean image). Diffusion models are designed for sampling from distributions, not supervised regression. Using them here seems backwards.

But it worked. The diffusion architecture, trained with direct supervision, matched or beat traditional UNets on denoising quality. More importantly, it was stabler to train and better at preserving fine anatomical details. This post explains why generative model architectures have value beyond generation, and the engineering required to make them work in supervised settings.

## The MRI Denoising Problem

MRI scans are noisy. Thermal noise from the receiver coils, motion artifacts from patient movement, and acquisition limitations all degrade image quality. For radiologists, noise makes diagnosis harder. For automated pipelines (segmentation, registration), noise kills performance.

The standard solution is to train a UNet. Give it noisy images as input, clean images as targets, minimize MSE loss. UNets are fast, simple, and work well. But they have limitations. Training large 3D UNets on volumetric MRI data is unstable. They often converge to blurry solutions that average out fine details. And they struggle with the extreme noise levels found in fast acquisition protocols.

I wanted to see if diffusion architectures, which are known for stable training and high-quality outputs, could do better.

## Why Diffusion Architectures?

Diffusion models aren't fundamentally different from other neural networks. They're UNets with specific design choices: residual blocks, attention mechanisms, timestep embeddings, and careful normalization. These choices were made to enable stable training on the diffusion objective (predicting noise at different timesteps).

But here's the insight: those design choices are useful even outside the diffusion framework. Residual connections help gradients flow. Attention lets the network focus on relevant features. Good normalization prevents training instabilities. These benefits don't disappear just because you're doing supervised learning instead of denoising diffusion.

So I took MONAI's Diffusion Denoising Model (DDM) architecture, ripped out the timestep conditioning and sampling logic, and trained it with plain MSE loss on paired noisy-clean data. The model doesn't know it's a diffusion model. It's just a particularly well-designed UNet.

## Implementation: Three Approaches

I implemented three variants to understand what actually mattered.

### Approach 1: Supervised Diffusion

This is the most faithful adaptation. I kept the diffusion architecture intact, including timestep embeddings, but trained it to predict clean images directly rather than predicting noise. The input is a noisy MRI volume, the target is the clean version, and the loss is MSE between the prediction and target.

The trick is in the noise schedule. Standard diffusion uses a cosine or linear schedule that gradually increases noise. For supervised denoising, I used a custom schedule optimized for MRI noise characteristics. Real MRI noise isn't Gaussian white noise. It has spatial structure (Rician distribution) and is correlated with signal intensity.

I matched the noise schedule to the actual noise distribution in my training data by fitting a mixture model to the noise residuals. This prevents the model from hallucinating structures that aren't in the clean images.

### Approach 2: DDM² Self-Supervised

For comparison, I also implemented the full DDM² pipeline (a recent paper on self-supervised MRI denoising). This is a three-stage process:

1. Train a noise model to learn the noise distribution from noisy data only
2. Match clean image states by finding noise-free examples in the training data
3. Train the denoising model using the matched states

The brilliance of DDM² is that it works without paired data. You only need noisy scans. The model learns to separate signal from noise by exploiting statistical properties of MRI acquisition.

I forked the original implementation and added support for bias field correction (a common MRI artifact where intensity varies spatially) and extended it to work with the COMFI dataset (Combined Multi-Field Imaging).

### Approach 3: Pure Supervised UNet (Baseline)

To measure whether the diffusion architecture actually helps, I trained a standard 3D UNet (MONAI's implementation) with the same data, same loss, same hyperparameters. This is the control condition.

## Results

The supervised diffusion model (Approach 1) achieved a 68% reduction in structural error (measured by SSIM) compared to the noisy input. The baseline UNet achieved 62%. That's a modest but measurable improvement.

More interesting is training stability. The diffusion model converged smoothly over 100 epochs with no hyperparameter tuning. The UNet required careful learning rate scheduling and sometimes diverged mid-training, requiring restarts.

Visual quality was where the difference was clearest. The UNet predictions were slightly blurry, averaging out high-frequency details. The diffusion model preserved fine anatomical structures better, particularly in areas with complex textures (cortical folding, white matter tracts).

DDM² (Approach 2) performed comparably to supervised methods despite using no paired data. This validates the approach for scenarios where you don't have ground truth clean images. But it's much slower to train (three stages instead of one) and more sensitive to hyperparameters.

## Inference: Single-Step vs Iterative

Standard diffusion inference runs multiple denoising steps (50-1000), gradually refining the output. For image generation, this is necessary to sample from the learned distribution. For supervised denoising, it's optional.

I implemented both single-step (one forward pass) and few-step (5-10 iterations) inference. Single-step was faster (50ms per volume vs 500ms for 10 steps) with minimal quality loss. The model learned a direct mapping from noisy to clean, so iterative refinement didn't help much.

This is critical for production deployment. Running 50 diffusion steps makes inference 50x slower. Single-step inference means diffusion models are practical for real-time applications.

## The Physics of MRI Noise

One thing that made this project harder than natural image denoising is the physics. MRI noise isn't additive Gaussian. It's Rician distributed (magnitude of complex Gaussian noise) and signal-dependent (higher signal, higher noise).

I added a custom loss function that weights errors based on local signal intensity. High-signal regions (bone, white matter) get higher weight than low-signal regions (CSF, air). This prevents the model from over-smoothing bright structures while ignoring dark regions.

I also generated synthetic training data by adding noise that matches real MRI physics. I simulated RF coil sensitivity, k-space acquisition patterns, and Rician noise distributions. This augmented the training data and made the model more robust to different scanner types.

## When This Approach Makes Sense

Using diffusion architectures for supervised denoising is overkill for most problems. If you have a standard image denoising task with plenty of data, a UNet will work fine and train faster.

Diffusion architectures shine when:

- You're working with 3D volumetric data where training is unstable
- Fine detail preservation is critical (medical imaging, scientific imaging)
- You want stable training without extensive hyperparameter tuning
- You have limited data and need the regularization benefits of a well-designed architecture

They don't make sense when:

- Inference latency is critical and you can't do single-step inference
- You need the simplest possible model for deployment (edge devices, embedded systems)
- You're optimizing for training speed over quality

## The Broader Lesson

This project taught me that architectural innovations from one problem domain often transfer to others. Diffusion models were designed for generation, but the architectural choices that make them work (residual blocks, attention, careful normalization) are useful for supervised learning too.

The lesson generalizes. Transformers were designed for NLP but work for vision. ResNets were designed for ImageNet but work for everything. When you see a new architecture, don't just think about what it was designed for. Think about what design choices it introduces and whether those choices solve problems in other domains.

The flip side is that you shouldn't use fancy architectures just because they're fancy. I spent months on this project and the improvement over UNets was modest. For many applications, the extra complexity isn't worth it. But for medical imaging, where every percentage point of quality matters and training stability is valuable, diffusion architectures are worth considering.

Repositories:
- [SupervisedDiffusion](https://github.com/nnigam96/SupervisedDiffusion)
- [DDM2 (forked)](https://github.com/nnigam96/DDM2)
- [MRI_Denoising](https://github.com/nnigam96/MRI_Denoising)
