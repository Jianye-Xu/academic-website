---
title: Truncated Taylor Control Barrier Function (TTCBF)
date: 2025-03-19
external_link: https://github.com/bassamlab/SigmaRL
tags:
  - CBF
---
We examine the complexity of the standard High-Order Control Barrier Function (HOCBF) approach and propose a truncated Taylor-based approach that reduces design parameters. First, we derive the explicit inequality condition for the HOCBF approach and show that the corresponding equality condition sets a lower bound on the barrier function value that regulates its decay rate. Next, we present our Truncated Taylor CBF (TTCBF), which uses a truncated Taylor series to approximate the discrete-time CBF condition. While the standard HOCBF approach requires multiple class K functions, leading to more design parameters as the constraint's relative degree increases, our TTCBF approach requires only one. We support our theoretical findings in numerical collision-avoidance experiments and show that our approach ensures safety while reducing design complexity.