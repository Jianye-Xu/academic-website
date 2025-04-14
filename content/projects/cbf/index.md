---
title: Control Barrier Functions for Safe Reinforcement Learning

date: 2025-03-01
tags:
  - CAV
  - CBF
  - MARL
---
# Control Barrier Functions for Safe Reinforcement Learning

This project studies the theoretical and practical aspects of Control Barrier Functions (CBFs) for safe reinforcement learning in the context of Connected and Automated Vehicles (CAVs).

## Less Conservative CBFs for Motion Planning of CAVs
We propose a learning-based CBF to reduce conservatism in collision avoidance of car-like robots. Traditional CBFs often use Euclidean distance between robots' centers as safety margin, neglecting headings and simplifying geometries to circles. While this ensures smooth, differentiable safety functions required by CBFs, it can be overly conservative in tight environments. To address this limitation, we design a heading-aware safety margin that accounts for the robots' orientations, enabling a less conservative and more accurate estimation of safe regions. Since the function computing this safety margin is non-differentiable, we approximate it with a neural network to ensure differentiability and facilitate integration with CBFs. We describe how we achieve bounded learning error and incorporate the upper bound into the CBF to provide formal safety guarantees through forward invariance. We show that our CBF is a high-order CBF with relative degree two for a system with two robots whose dynamics are modeled by the nonlinear kinematic bicycle model. Experimental results in overtaking and bypassing scenarios reveal a 33.5 % reduction in conservatism compared to traditional methods, while maintaining safety

<a href="https://arxiv.org/abs/2411.08999" target="_blank" rel="noopener noreferrer" class="inline-block bg-primary-600 text-white font-semibold px-4 py-2 rounded hover:bg-primary-700 transition">
  arXiv
</a>


## High-Order CBFs
We examine the complexity of the standard High-Order CBF (HOCBF) approach and propose a truncated Taylor-based approach that reduces design parameters. First, we derive the explicit inequality condition for the HOCBF approach and show that the corresponding equality condition sets a lower bound on the barrier function value that regulates its decay rate. Next, we present our Truncated Taylor CBF (TTCBF), which uses a truncated Taylor series to approximate the discrete-time CBF condition. While the standard HOCBF approach requires multiple class K functions, leading to more design parameters as the constraint's relative degree increases, our TTCBF approach requires only one. We support our theoretical findings in numerical collision-avoidance experiments and show that our approach ensures safety while reducing design complexity.

<a href="https://arxiv.org/abs/2503.15014" target="_blank" rel="noopener noreferrer" class="inline-block bg-primary-600 text-white font-semibold px-4 py-2 rounded hover:bg-primary-700 transition">
  arXiv
</a>
