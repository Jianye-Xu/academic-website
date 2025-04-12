---
title: MTV-based CBF
date: 2024-11-13
external_link: https://github.com/bassamlab/SigmaRL
tags:
  - MARL
---
We propose a learning-based Control Barrier Function (CBF) to reduce conservatism in collision avoidance of car-like robots. Traditional CBFs often use Euclidean distance between robots' centers as safety margin, neglecting headings and simplifying geometries to circles. While this ensures smooth, differentiable safety functions required by CBFs, it can be overly conservative in tight environments. To address this limitation, we design a heading-aware safety margin that accounts for the robots' orientations, enabling a less conservative and more accurate estimation of safe regions. Since the function computing this safety margin is non-differentiable, we approximate it with a neural network to ensure differentiability and facilitate integration with CBFs. We describe how we achieve bounded learning error and incorporate the upper bound into the CBF to provide formal safety guarantees through forward invariance. We show that our CBF is a high-order CBF with relative degree two for a system with two robots whose dynamics are modeled by the nonlinear kinematic bicycle model. Experimental results in overtaking and bypassing scenarios reveal a 33.5 % reduction in conservatism compared to traditional methods, while maintaining safety.