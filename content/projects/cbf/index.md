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


## TTCBF: A Truncated Taylor Control Barrier Function for High-Order Safety Constraints
High-Order Control Barrier Functions (HOCBFs) handle safety constraints with relative degree greater than one by introducing a chain of auxiliary functions. This requires multiple class K functions, whose number and tuning burden grow with the relative degree. Because their parameters affect the conservatism and feasibility of the resulting control constraint, tuning them can complicate controller design. We introduce a Truncated Taylor Control Barrier Function (TTCBF), which extends the discrete-time CBF formulation to high-order safety constraints using a single class K function, independent of relative degree. We also propose an adaptive variant, aTTCBF, which optimizes the class K gain online. This paper updates our earlier TTCBF preprint, which remains available at its original arXiv record.

<a href="https://arxiv.org/abs/2601.15196" target="_blank" rel="noopener noreferrer" class="inline-block bg-primary-600 text-white font-semibold px-4 py-2 rounded hover:bg-primary-700 transition">
  Updated paper (arXiv:2601.15196)
</a>

<a href="https://arxiv.org/abs/2503.15014" target="_blank" rel="noopener noreferrer" class="inline-block bg-primary-600 text-white font-semibold px-4 py-2 rounded hover:bg-primary-700 transition">
  Earlier preprint (arXiv:2503.15014)
</a>
