---
title: "Deep Learning for Wireless CSI Compression"
year: "2022"
description: "Novel compression architecture handling variable input dimensions for Channel State Information (CSI) feedback."
tags: ["Deep Learning", "Wireless Communication", "Compression", "Research"]
metric_value: "40%"
metric_label: "Bandwidth Reduction"
featured: True
order: 7
---

## The Challenge
In Massive MIMO systems, User Equipment (UE) must feedback the Channel State Information (CSI) matrix ($H$) so the base station can optimize transmission. However, $H$ is a massive multi-dimensional complex tensor.

Existing deep learning solutions like **CsiNet** rely on dense layers, forcing them to work with fixed input dimensions. This is impractical for real-world networks where the number of allocated sub-carriers ($N_c$) changes dynamically. Furthermore, prior baselines often simplified the problem by ignoring the receiver antenna dimension ($N_{rx}$), creating unrealistic test environments.

## The Solution
I developed a **3D Fully Convolutional Autoencoder** capable of compressing variable-sized channel matrices without retraining.

* **Complex-Valued 3D Architecture:** Unlike 2D baselines, I engineered the model to treat the channel as a 4D tensor ($N_c \times N_{tx} \times N_{rx} \times 2$), utilizing **3D Convolutions** to capture spatial correlations across transmit *and* receive antennas simultaneously.
* **Dynamic Padding Strategy:** Implemented a smart padding logic that scales inputs to the nearest pooling factor (multiples of 8), minimizing the computational waste typical of fixed-size buffers.
* **Custom Loss Function (`scaledMSE`):** Designed a specialized loss function that applies a binary mask during training. This forces the network to optimize only for the relevant sub-carriers and "ignore" the zero-padded regions, preventing the model from learning artifacts.
* **Attention Integration:** Embedded **Convolutional Block Attention Modules (CBAM)** to apply channel and spatial attention, allowing the encoder to prioritize information-dense features over noise.

## The Impact
* **Bandwidth Efficiency:** Achieved a **40% reduction in feedback overhead** compared to SOTA baselines while maintaining signal reconstruction quality (NMSE).
* **Robustness:** Validated on both **CDL-B** and **COST 2100** datasets, proving the model's stability across indoor and outdoor propagation environments.
* **Flexibility:** The architecture eliminates the need to deploy multiple models for different bandwidth configurations, significantly reducing the memory footprint on user devices.