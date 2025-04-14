---
title: Multi-Agent Reinforcement Learning and its Applications in Connected and Automated Vehicles

date: 2024-01-01
tags:
  - CAV
  - MARL
---
# Multi-Agent Reinforcement Learning and its Applications in Connected and Automated Vehicles

This project addressed the challenges in Multi-Agent Reinforcement Learning (MARL) and its applications in Connected and Automated Vehicles (CAVs).

## Challenge 1: Sample Efficiency and Generalization
Sample efficiency and generalization are two key challenges in MARL. Most RL agents exhibit a limited capacity to generalize, often focusing narrowly on specific scenarios, and are usually evaluated in similar or even the same scenarios seen during training. Various methods have been proposed to address these challenges, including experience replay and regularization. However, how observation design in RL affects sample efficiency and generalization remains an under-explored area. We introduce an open-source, decentralized framework named SigmaRL, designed to enhance both sample efficiency and generalization of MARL for motion planning of CAVs. We address this gap by proposing five strategies to design information-dense observations, focusing on general features that are applicable to most traffic scenarios. We train our RL agents using these strategies on an intersection and evaluate their generalization through numerical experiments across completely unseen traffic scenarios, including a new intersection, an on-ramp, and a roundabout. Incorporating these information-dense observations reduces training times to under one hour on a single CPU, and the evaluation results reveal that our RL agents can effectively zero-shot generalize.

<a href="https://arxiv.org/abs/2408.07644" target="_blank" rel="noopener noreferrer" class="inline-block bg-primary-600 text-white font-semibold px-4 py-2 rounded hover:bg-primary-700 transition">
  arXiv
</a>


## Challenge 2: Non-Stationarity
Non-stationarity poses a fundamental challenge in MARL, arising from agents simultaneously learning and altering their policies. This creates a non-stationary environment from the perspective of each individual agent, often leading to suboptimal or even unconverged learning outcomes. We propose an open-source framework named XP-MARL, which augments MARL with auxiliary prioritization to address this challenge in cooperative settings. XP-MARL is 1) founded upon our hypothesis that prioritizing agents and letting higher-priority agents establish their actions first would stabilize the learning process and thus mitigate non-stationarity and 2) enabled by our proposed mechanism called action propagation, where higher-priority agents act first and communicate their actions, providing a more stationary environment for others. Moreover, instead of using a predefined or heuristic priority assignment, XP-MARL learns priority-assignment policies with an auxiliary MARL problem, leading to a joint learning scheme. Experiments in a motion-planning scenario involving CAVs demonstrate that XP-MARL improves the safety of a baseline model by 84.4% and outperforms a state-of-the-art approach, which improves the baseline by only 12.8%

<a href="https://arxiv.org/abs/2409.11852" target="_blank" rel="noopener noreferrer" class="inline-block bg-primary-600 text-white font-semibold px-4 py-2 rounded hover:bg-primary-700 transition">
  arXiv
</a>
