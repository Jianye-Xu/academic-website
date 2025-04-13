---
title: SigmaRL
date: 2024-08-14
tags:
  - MARL
---
This paper introduces an open-source, decentralized framework named SigmaRL, designed to enhance both sample efficiency and generalization of multi-agent Reinforcement Learning (RL) for motion planning of connected and automated vehicles. Most RL agents exhibit a limited capacity to generalize, often focusing narrowly on specific scenarios, and are usually evaluated in similar or even the same scenarios seen during training. Various methods have been proposed to address these challenges, including experience replay and regularization. However, how observation design in RL affects sample efficiency and generalization remains an under-explored area. We address this gap by proposing five strategies to design information-dense observations, focusing on general features that are applicable to most traffic scenarios. We train our RL agents using these strategies on an intersection and evaluate their generalization through numerical experiments across completely unseen traffic scenarios, including a new intersection, an on-ramp, and a roundabout. Incorporating these information-dense observations reduces training times to under one hour on a single CPU, and the evaluation results reveal that our RL agents can effectively zero-shot generalize.

[View on GitHub](https://github.com/bassamlab/SigmaRL)
