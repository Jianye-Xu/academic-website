---
title: News
summary: News.
date: 2023-04-01
type: landing

cascade:
  - _target:
      kind: page
    params:
      show_breadcrumb: true

sections:
  - block: collection
    id: news
    content:
      title: News
      filters:
        folders:
          - news
      # Page order: descending (desc) or ascending (asc) date.
      order: asc
    design:
      view: article-grid
      columns: 3
---
