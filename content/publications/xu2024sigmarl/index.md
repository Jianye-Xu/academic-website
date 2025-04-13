---
title: "SigmaRL: A Sample-Efficient and Generalizable Multi-Agent Reinforcement Learning Framework for Motion Planning"
authors:


date: "2024-09-01T00:00:00Z"
doi: ""

# Schedule page publish date (NOT publication's date).
publishDate: "2024-09-01T00:00:00Z"

# Publication type.
# Legend: 0 = Uncategorized; 1 = Conference paper; 2 = Journal article;
# 3 = Preprint / Working Paper; 4 = Report; 5 = Book; 6 = Book section;
# 7 = Thesis; 8 = Patent
publication_types: ["1"]

# Publication name and optional abbreviated publication name.
publication: In *The 17th International Symposium on Distributed Autonomous Robotic Systems (DARS)*
publication_short: In *Distributed Autonomous Robotic Systems (DARS)*

abstract: This paper introduces an open-source, decentralized framework named SigmaRL, designed to enhance both sample effciency and generalization of multi-agent Reinforcement Learning (RL) for motion planning of connected and automated vehicles. Most RL agents exhibit a limited capacity to generalize, often focusing narrowly on specific scenarios, and are usually evaluated in similar or even the same scenarios seen during training. Various methods have been proposed to address these challenges, including experience replay and regularization. However, how observation design in RL affects sample efficiency and generalization remains an under-explored area. We address this gap by proposing five strategies to design information-dense observations, focusing on general features that are applicable to most traffic scenarios. We train our RL agents using these strategies on an intersection and evaluate their generalization through numerical experiments across completely unseen traffic scenarios, including a new intersection, an on-ramp, and a roundabout. Incorporating these information-dense observations reduces training times to under one hour on a single CPU, and the evaluation results reveal that our RL agents can effectively zero-shot generalize. [Code](https://github.com/cas-lab-munich/SigmaRL)
# Summary. An optional shortened abstract.
summary: This paper introduces an open-source, decentralized framework named SigmaRL, designed to enhance both sample effciency and generalization of multi-agent Reinforcement Learning (RL) for motion planning of connected and automated vehicles.

tags:
- Multi-Agent Reinforcement Learning

featured: false

links:
- name: arXiv
  url: https://arxiv.org/abs/2408.07644
- name: Slides
  url: slides.pdf
url_pdf: ''
url_code: 'https://github.com/bassamlab/SigmaRL'
url_dataset: ''
url_poster: ''
url_project: ''
url_slides: ''
url_source: ''
url_video: 'https://youtu.be/tzaVjol4nhA'

# Featured image
# To use, add an image named `featured.jpg/png` to your page's folder. 
image:
  caption: ''
  placement: 3
  preview_only: false

# Associated Projects (optional).
#   Associate this publication with one or more of your projects.
#   Simply enter your project's folder or file name without extension.
#   E.g. `internal-project` references `content/project/internal-project/index.md`.
#   Otherwise, set `projects: []`.
projects: []

# Slides (optional).
#   Associate this publication with Markdown slides.
#   Simply enter your slide deck's filename without extension.
#   E.g. `slides: "example"` references `content/slides/example/index.md`.
#   Otherwise, set `slides: ""`.
slides: ""
---