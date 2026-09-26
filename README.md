# Jianye Xu’s academic website

An independently implemented, minimal academic website for **https://jianyexu.com/**. Plain HTML, CSS, and JavaScript, with a small Node.js build script and no npm dependencies. The redesign is developed on `redesign/minimal-academic`; it has not been deployed.

## Preview and check

Requires Node.js 20 or newer. No installation step is needed.

```sh
npm run build
npm test
npm run preview
```

Open **http://localhost:4173**. The server binds only to the local computer. Stop it with Ctrl+C. Build output is in `dist/` and should not be edited or committed.

## File organization

- `site/templates/index.html`: semantic page structure, introduction, contact links, SEO metadata.
- `site/assets/site.css`: responsive layout, typography, print styles, and reduced-motion support.
- `site/assets/site.js`: progressive enhancement for publication filters, citation copying, and legacy anchors.
- `site/assets/filters.js`: publication matching and query-string parsing.
- `site/assets/`: existing portrait and research figures; no reference-site assets.
- `site/data/publications.json`: one record per paper, including metadata, tags, links, figures, summary, and BibTeX.
- `site/data/news.json`: news sorted by date during the build.
- `site/data/profile.json`: education, experience, awards, talks, and academic service.
- `site/data/teaching.json`: complete thesis and seminar supervision lists.
- `scripts/build.mjs`: dependency-free static HTML generator and legacy URL compatibility pages.
- `tests/site.test.mjs`: filter behavior, static content, citations, local assets, and anchor checks.

The old Hugo source is retained as a migration archive and is no longer used to build the site. Do not edit it to update the redesigned site. `static/uploads/resume.pdf` remains the CV source. `publications.bib` and the old publication import workflow are historical: updating them alone does not update the redesign.

## Update a publication

Add an object to `site/data/publications.json`, then rebuild. Preserve a stable, unique `id`, since it becomes the paper’s anchor and legacy route. Use `status: "peer-reviewed"` or `"preprint"`, an explicit `selected` boolean, and one or more of `MARL`, `Safe Control`, `CAVs`, `Robotics` in `tags`. Selected flags and topic tags are editorial choices and can be changed independently of publication metadata.

Available resource keys are `paper`, `publisher`, `code`, `video`, and `project`. Omit unavailable resources; the site does not render dead or disabled links. Put a verified citation in `bibtex` to show a native expandable BibTeX panel, copying, and a `.bib` download. Each paper remains one independent item even when it shares a code repository with another paper.

Use `image: "/assets/example.png"` (also accepts JPEG, WebP, or GIF) and descriptive `imageAlt`. Images are shown without cropping and lazy-loaded. The migrated figures use optimized 960-pixel previews with `fullImage` pointing to their full-resolution originals. Use a still preview and a `video` link for motion-heavy demonstrations or animations that cannot respect reduced-motion preferences. If no verified image is available, leave `image` null: the site shows a simple typographic paper preview. Do not substitute unrelated experimental figures.

Publication selection and research-area filters combine with AND, update the result count, and can be shared through URL query parameters, for example `/?type=preprint&area=Safe+Control#research`. All papers and citations are present in the generated HTML even without JavaScript.

## Update news and other sections

Add news with an ISO `date`, `title`, `summary`, and `url`. The newest announcement is initially shown; older items are in a native disclosure that also works without JavaScript. `recentNewsCount` in the build script controls the initial count. Only two verified announcements existed at migration, so no acceptance announcements or dates were invented.

The profile data includes roles and talks transcribed from the existing downloadable CV. Teaching keeps all 20 theses and 14 seminar works in expandable lists. Details of the historical CPM Olympics remain available under its news disclosure, and previous academic URLs redirect to relevant homepage anchors.

## Deployment and domain

Nothing is deployed by local build or preview commands. GitHub Pages deploys **only from `main`**; pull requests build and test a downloadable artifact without deploying. The manual workflow also refuses deployment from other branches. Netlify uses the same build and supports branch/deploy previews. Preview builds are marked `noindex` when `SITE_PREVIEW=true`.

The generated `CNAME`, canonical URL, sitemap, and social metadata preserve `jianyexu.com`. No DNS or hosting settings have been changed. Review the redesign before merging into `main`, since merging triggers the existing production deployment mechanism.

## Content review notes

- All 13 existing publication records are retained, including the 2021 CPM Lab platform paper. Jianye Xu is not in that paper’s author list, so it is explicitly identified as a related platform paper.
- The 2025 and 2026 TTCBF preprints remain separate records, with the earlier paper labeled accordingly.
- The existing site lists undergraduate study as August 2016–September 2020; the CV lists October 2016–September 2019, plus exchange studies in October 2019–August 2020. Homepage degree dates were preserved and exchange studies added separately. Please reconcile the dates when updating the CV/site.
- The Ph.D. end date from the old site is now explicitly labeled “expected.”
- The six paper figures come from the repository. Other papers have citation previews until verified paper-specific media are supplied. Video links are supported but are not invented.
- No reviewer appointments or talk titles beyond the CV were inferred.

## Design reference

The layout study used [Jung-Hoon Cho’s website](https://www.junghooncho.com/) for general academic hierarchy: compact introduction, dated news, adjacent publication previews/citations, and separate selection/area controls. All HTML, CSS, and JavaScript here were written independently. No reference text, code, figures, or other assets were copied.
