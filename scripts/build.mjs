import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'dist');
const read = name => readFile(path.join(root, name), 'utf8');
const data = async name => JSON.parse(await read(`data/${name}.json`));
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const link = (url, label, attrs = '') => `<a href="${escape(url)}" ${attrs}>${label}</a>`;
const markdown = text => escape(text).replace(/\[([^\]]+)\]\((https:\/\/[^)]+|#[\w-]+)\)/g, '<a href="$2">$1</a>').replace(/\*([^*]+)\*/g, '<em>$1</em>');
const [publications, news, profile, teaching] = await Promise.all(['publications', 'news', 'profile', 'teaching'].map(data));

function validate() {
  const ids = new Set();
  for (const p of publications) {
    if (!/^[a-z0-9-]+$/.test(p.id) || ids.has(p.id)) throw Error(`Invalid or duplicate publication ID: ${p.id}`);
    ids.add(p.id);
    if (!p.title || !p.authors.length || !Number.isInteger(p.year) || !p.venue || !['preprint', 'peer-reviewed'].includes(p.status)) throw Error(`Incomplete publication: ${p.id}`);
    if (!p.tags.length || !p.tags.every(tag => ['Learning', 'Safe Control', 'CAVs'].includes(tag))) throw Error(`Invalid tags: ${p.id}`);
    for (const url of Object.values(p.links)) if (!/^https:\/\//.test(url)) throw Error(`Invalid resource URL: ${p.id}`);
    if (p.links.publisher && !p.publisherName) throw Error(`Missing publisher name: ${p.id}`);
    if (p.image && (!p.image.startsWith('/assets/') || !p.imageAlt)) throw Error(`Invalid image: ${p.id}`);
  }
  for (const n of news) if (!/^\d{4}-\d{2}-\d{2}$/.test(n.date) || !n.title || (n.url && !/^https:\/\//.test(n.url))) throw Error('Invalid news entry');
}
validate();

function paper(p) {
  const title = escape(p.title);
  const badge = p.selected ? '<span class="selected-star" aria-label="Selected publication">★</span>' : '';
  const preview = p.image
    ? `<a class="publication-preview" href="${escape(p.fullImage || p.image)}" aria-label="View full figure: ${title}"><img src="${escape(p.image)}" alt="${escape(p.imageAlt)}" loading="lazy" decoding="async" width="640" height="430"></a>`
    : `<a class="publication-preview paper-cover" href="${escape(p.links.paper)}" aria-label="Read paper: ${title}"><span class="cover-venue">${escape(p.shortVenue)}</span><span class="cover-title">${escape(p.previewTitle || p.title)}</span><span class="cover-year">${p.year} <span aria-hidden="true">↗</span></span></a>`;
  const labels = { paper: p.preprintServer || 'arXiv', publisher: p.publisherName, code: 'Code', video: 'Video', project: 'Project Page' };
  const resources = Object.entries(labels).filter(([key]) => p.links[key] && (key !== 'publisher' || p.status === 'peer-reviewed')).map(([key, label]) => link(p.links[key], escape(label))).join('');
  const disclosures = [p.bibtex && ['bibtex', 'BibTeX'], p.abstract && ['abstract', 'Abstract']].filter(Boolean).map(([kind, label]) => `<button type="button" class="disclosure-button" aria-expanded="false" aria-controls="${kind}-${p.id}" hidden>${label}</button>`).join('');
  return `<article class="publication" id="${p.id}" data-status="${p.status}" data-selected="${p.selected}" data-tags="${escape(p.tags.join('|'))}" aria-labelledby="title-${p.id}"><figure class="preview-container">${preview}</figure><div class="publication-body"><h3 id="title-${p.id}">${badge}${title}</h3><p class="authors">${p.authors.map(author => author === 'Jianye Xu' ? `<strong>${escape(author)}</strong>` : escape(author)).join(', ')}</p><p class="venue"><strong>${escape(p.venue)}</strong> · ${p.year}<span class="tags">${p.status === 'preprint' ? '<span class="preprint-badge">Preprint</span>' : ''}${p.tags.map(tag => `<span class="tag" data-tag="${escape(tag)}">${escape(tag)}</span>`).join('')}</span></p>${p.note ? `<p class="paper-note">${escape(p.note)}</p>` : ''}<div class="paper-links">${resources}${disclosures}</div>${p.bibtex ? `<details class="paper-details citation" id="bibtex-${p.id}"><summary>BibTeX</summary><div class="citation-actions">${link(`/publication/${p.id}/cite.bib`, 'Download .bib')}<button type="button" class="copy-button" data-citation="cite-${p.id}" hidden>Copy BibTeX</button></div><pre id="cite-${p.id}">${escape(p.bibtex.trim())}</pre></details>` : ''}${p.abstract ? `<details class="paper-details" id="abstract-${p.id}"><summary>Abstract</summary><p>${escape(p.abstract)}</p></details>` : ''}</div></article>`;
}
const formatMonth = date => new Date(`${date.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const newsRow = item => `<li class="news-row"><time datetime="${item.date}">${formatMonth(item.date)}</time><div><span class="news-title">${markdown(item.title)}</span><p class="muted">${markdown(item.summary)}</p>${item.title.includes("CPM Olympics") ? '<details class="paper-details"><summary>Competition timeline and example scenario</summary><img src="/news/cpm-olympics/timeline.png" alt="CPM Olympics competition timeline" loading="lazy"><video controls preload="none" aria-label="CPM Olympics example motion-planning scenario"><source src="/news/cpm-olympics/scenario-example.mp4" type="video/mp4"><a href="/news/cpm-olympics/scenario-example.mp4">Download scenario video</a></video></details>' : ''}</div></li>`;
const sortedNews = [...news].sort((a,b) => b.date.localeCompare(a.date));
const newsHTML = `<div class="news-scroll" role="region" aria-label="News" tabindex="0"><ul class="news-list">${sortedNews.map(newsRow).join('')}</ul></div>`;
const filterButtons = (group, entries) => entries.map(([value, label]) => `<button type="button" class="filter-button" ${group === 'tag' && value !== 'all' ? `data-tag="${escape(value)}" ` : ''}data-group="${group}" data-value="${value}" aria-pressed="${value === 'all'}" aria-controls="publications">${label}</button>`).join('');
const entries = items => `<ul class="entry-list">${items.map(item => `<li class="entry"><p class="entry-date">${escape(item.date)}</p><div><h3>${escape(item.title)}</h3><p>${escape(item.organization)}</p><p class="entry-detail">${markdown(item.description)}</p></div></li>`).join('')}</ul>`;
const compactEntries = items => `<ul class="entry-list compact-entries">${items.map(item => `<li><span class="entry-date">${escape(item.date)}</span> <h4>${escape(item.title)}</h4> <span class="muted">· ${escape(item.organization)}</span> <span>· ${markdown(item.description)}</span></li>`).join('')}</ul>`;
const education = `<ul class="entry-list">${profile.education.map(item => `<li class="entry"><p class="entry-date">${formatMonth(item.date_start)} –<br>${formatMonth(item.date_end)}${item.area.startsWith('Ph.D.') ? ' (expected)' : ''}</p><div><h3>${escape(item.area)}</h3><p>${escape(item.institution)}</p><p class="entry-detail">${markdown(item.summary.trim())}</p></div></li>`).join('')}</ul>`;
const supervision = (kind, title) => {
  if (kind === 'theses') return `<details class="supervision" id="theses"><summary>${title} <span class="muted">(${teaching.theses.length})</span></summary><ul class="award-list thesis-list">${teaching.theses.map(item => `<li><details class="award-details"><summary><span class="award-year">${escape(item.year)}</span> <strong>${escape(item.student)}</strong> · <span>${escape(item.title)}</span></summary><p>${escape(item.details)}</p></details></li>`).join('')}</ul></details>`;
  let lastTerm;
  return `<details class="supervision" id="${kind}"><summary>${title} <span class="muted">(${teaching[kind].length})</span></summary>${teaching[kind].map(item => {
    const heading = item.term !== lastTerm && item.term ? `<h4>${escape(item.term)}</h4>` : '';
    lastTerm = item.term;
    return `${heading}<p class="supervised-item">${markdown(item.text)}</p>`;
  }).join('')}</details>`;
};
const replacements = {
  NEWS: newsHTML,
  COUNT: publications.length,
  PUBLICATIONS: [...publications].sort((a,b) => b.year-a.year).map(paper).join('\n'),
  STATUS_FILTERS: filterButtons('type', [['all','All'],['selected','★ Selected']]),
  TAG_FILTERS: filterButtons('tag', [['all','All'],['Learning','Learning'],['Safe Control','Safe Control'],['CAVs','CAVs']]),
  EDUCATION: education,
  AWARDS: `<ul class="award-list">${profile.awards.map(item => `<li><details class="award-details"><summary><span class="award-year">${item.date.slice(0,4)}</span> <strong>${escape(item.title)}</strong> <span class="awarder">· ${escape(item.awarder)}</span></summary><p>${markdown(item.summary.trim())}</p></details></li>`).join('')}</ul>`,
  TALKS: compactEntries(profile.talks),
  TEACHING: entries(teaching.lectures) + supervision('theses','Supervised theses') + supervision('seminar','Supervised seminar works'),
  SERVICE: compactEntries(profile.service),
  JOURNAL_REVIEWING: `<p class="activity-summary">${profile.journalReviewing.map(escape).join(', ')}.</p>`,
  CONFERENCE_REVIEWING: `<p class="activity-summary">${profile.conferenceReviewing.map(escape).join(', ')}.</p>`,
  MEMBERSHIP: `<p class="activity-summary">${profile.membership.map(escape).join(', ')}.</p>`,
  YEAR: new Date().getFullYear(),
};
let html = await read('index.html');
for (const [key, value] of Object.entries(replacements)) html = html.replace(`{{${key}}}`, value);
if (/\{\{\w+\}\}/.test(html)) throw Error('Unresolved template field');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(path.join(root,'assets'), path.join(out,'assets'), { recursive: true });
await mkdir(path.join(out,'uploads'), { recursive: true });
await cp(path.join(root,'assets/resume.pdf'), path.join(out,'uploads/resume.pdf'));
if (process.env.SITE_PREVIEW === 'true') html = html.replace('</head>', '<meta name="robots" content="noindex, nofollow"></head>');
if (profile.analytics?.goatcounter && process.env.SITE_PREVIEW !== 'true') html = html.replace('</head>', `<script data-goatcounter="https://${profile.analytics.goatcounter}.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script></head>`);
await writeFile(path.join(out,'index.html'), html);
await writeFile(path.join(out,'CNAME'), 'jianyexu.com\n');
await writeFile(path.join(out,'.nojekyll'), '');
await writeFile(path.join(out,'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: https://jianyexu.com/sitemap.xml\n');
await writeFile(path.join(out,'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://jianyexu.com/</loc></url></urlset>');
await writeFile(path.join(out,'404.html'), '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Page not found | Jianye Xu</title><link rel="stylesheet" href="/assets/site.css"><main class="wrap"><h1>Page not found</h1><p>This page may have moved. <a href="/">Return to Jianye Xu’s homepage</a>.</p></main></html>');
// Compatibility pages keep previously shared academic URLs useful.
const redirects = { 'publication':'research', 'projects':'research', 'news':'news', 'teaching':'teaching', 'awards':'awards', 'projects/cbf':'research', 'projects/marl':'research', 'projects/small-scale-testbeds':'research', 'teaching/cpnav':'teaching', 'teaching/theses':'theses', 'teaching/seminar':'seminar', 'news/cpm-olympics':'news', 'news/iv24-workshop':'news' };
for (const p of publications) {
  redirects[`publication/${p.id}`] = p.id;
  const dir = path.join(out,'publication',p.id);
  await mkdir(dir,{recursive:true});
  if (p.bibtex) await writeFile(path.join(dir,'cite.bib'),p.bibtex);
}
for (const [route, anchor] of Object.entries(redirects)) {
  const dir=path.join(out,route); await mkdir(dir,{recursive:true});
  await writeFile(path.join(dir,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="refresh" content="0;url=/#${anchor}"><link rel="canonical" href="https://jianyexu.com/#${anchor}"><title>Jianye Xu</title><p>This content is now on <a href="/#${anchor}">Jianye Xu’s homepage</a>.</p></html>`);
}
// Preserve news media and teaching resources linked from older pages.
for (const [source, dest] of [['assets/cpm-scenario.mp4','news/cpm-olympics/scenario-example.mp4'],['assets/cpm-timeline.png','news/cpm-olympics/timeline.png'],['assets/lab-architecture.png','teaching/cpnav/lab-architecture.png']]) await cp(path.join(root,source),path.join(out,dest));
console.log(`Built ${publications.length} publications, ${news.length} news entries, ${profile.awards.length} awards, ${teaching.theses.length} theses, and ${teaching.seminar.length} seminar works → dist/`);
