---
title: "Deep Learning for Wireless CSI Compression"
year: "2022"
description: "Novel 3D Convolutional Autoencoder handling variable input dimensions for massive MIMO CSI feedback."
tags: ["Deep Learning", "Wireless Communication", "Compression", "Research"]
metrics:
  - value: "40%"
    label: "Bandwidth Reduction"
  - value: "4x"
    label: "Signal Accuracy vs SOTA"
featured: true
order: 7
stack_category: ["Deep Learning", "Wireless Communication", "Computer Vision", "Research"]
retrieval_hooks: ["Engineered 3D fully convolutional autoencoder for variable-sized channel matrix compression", "Implemented dynamic padding strategy scaling inputs to nearest pooling factor for computational efficiency", "Designed custom scaledMSE loss function with binary masking for sub-carrier optimization", "Integrated Convolutional Block Attention Modules (CBAM) for autonomous feature prioritization"]
---

## The Challenge
In Massive MIMO wireless systems, transmitting the full Channel State Information (CSI) matrix 'H' back to the base station consumes excessive bandwidth. Standard deep learning compression models (like CsiNet) are rigid, relying on dense layers that require fixed input dimensions. This fails in real-world networks where the number of allocated sub-carriers 'Nc' changes dynamically, forcing operators to train and deploy separate models for every possible bandwidth configuration.

## The Solution
I engineered a **3D Fully Convolutional Autoencoder** architecture designed to compress variable-sized channel matrices without retraining.

1.  **Complex-Valued 3D Architecture:** Unlike prior 2D baselines, I modeled the channel as a 4D tensor ($N_c \times N_{tx} \times N_{rx} \times 2$), utilizing **3D Convolutions** to capture spatial correlations across transmit *and* receive antennas simultaneously.
2.  **Dynamic Padding Strategy:** Implemented a smart padding logic that scales inputs to the nearest pooling factor (multiples of 8), minimizing the computational waste typical of fixed-size buffers.
3.  **Custom Loss Function (`scaledMSE`):** Designed a specialized loss function that applies a binary mask during training. This forces the network to optimize only for the relevant sub-carriers and "ignore" the zero-padded regions, preventing the model from learning artifacts.
4.  **Attention Integration:** Embedded **Convolutional Block Attention Modules (CBAM)** to apply channel and spatial attention, allowing the encoder to autonomously prioritize information-dense features over noise.

## The Impact
* **Bandwidth Efficiency:** Achieved a **40% reduction in feedback overhead** compared to state-of-the-art baselines while maintaining signal reconstruction quality (NMSE).
* **Signal Quality:** Demonstrated a **4x improvement in reconstruction accuracy** over CsiNet in complex outdoor environments (approx. 6.3 dB gain), effectively reconstructing high-fidelity signals even at high compression ratios.
* **Operational Flexibility:** The architecture eliminates the need to deploy multiple models for different bandwidth configurations, significantly reducing the memory footprint and management complexity for user devices.