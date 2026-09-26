import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'dist');
const read = name => readFile(path.join(root, name), 'utf8');
const data = async name => JSON.parse(await read(`site/data/${name}.json`));
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const link = (url, label, attrs = '') => `<a href="${escape(url)}" ${attrs}>${label}</a>`;
const markdown = text => escape(text).replace(/\[([^\]]+)\]\((https:\/\/[^)]+)\)/g, '<a href="$2">$1</a>').replace(/\*([^*]+)\*/g, '<em>$1</em>');
const [publications, news, profile, teaching] = await Promise.all(['publications', 'news', 'profile', 'teaching'].map(data));

function validate() {
  const ids = new Set();
  for (const p of publications) {
    if (!/^[a-z0-9-]+$/.test(p.id) || ids.has(p.id)) throw Error(`Invalid or duplicate publication ID: ${p.id}`);
    ids.add(p.id);
    if (!p.title || !p.authors.length || !Number.isInteger(p.year) || !p.venue || !['preprint', 'peer-reviewed'].includes(p.status)) throw Error(`Incomplete publication: ${p.id}`);
    if (!p.tags.length || !p.tags.every(tag => ['MARL', 'Safe Control', 'CAVs', 'Robotics'].includes(tag))) throw Error(`Invalid tags: ${p.id}`);
    for (const url of Object.values(p.links)) if (!/^https:\/\//.test(url)) throw Error(`Invalid resource URL: ${p.id}`);
    if (p.image && (!p.image.startsWith('/assets/') || !p.imageAlt)) throw Error(`Invalid image: ${p.id}`);
  }
  for (const n of news) if (!/^\d{4}-\d{2}-\d{2}$/.test(n.date) || !n.title || !/^https:\/\//.test(n.url)) throw Error('Invalid news entry');
}
validate();

function paper(p) {
  const title = escape(p.title);
  const badge = p.selected ? '<span class="selected-star" aria-label="Selected publication">★</span>' : '';
  const preview = p.image
    ? `<a class="publication-preview" href="${escape(p.fullImage || p.image)}" aria-label="View full figure: ${title}"><img src="${escape(p.image)}" alt="${escape(p.imageAlt)}" loading="lazy" decoding="async" width="640" height="430"></a>`
    : `<a class="publication-preview paper-cover" href="${escape(p.links.paper)}" aria-label="Read paper: ${title}"><span class="cover-venue">${escape(p.shortVenue)}</span><span class="cover-title">${escape(p.previewTitle || p.title)}</span><span class="cover-year">${p.year} <span aria-hidden="true">↗</span></span></a>`;
  const labels = { paper: 'Paper', publisher: 'Publisher', code: 'Code', video: 'Video', project: 'Project Page' };
  const resources = Object.entries(labels).filter(([key]) => p.links[key]).map(([key, label]) => link(p.links[key], label)).join('');
  return `<article class="publication" id="${p.id}" data-status="${p.status}" data-selected="${p.selected}" data-tags="${escape(p.tags.join('|'))}" aria-labelledby="title-${p.id}"><figure class="preview-container">${preview}</figure><div class="publication-body"><h3 id="title-${p.id}">${badge}${link(p.links.paper, title)}</h3><p class="authors">${p.authors.map(author => author === 'Jianye Xu' ? `<strong>${escape(author)}</strong>` : escape(author)).join(', ')}</p><p class="venue"><strong>${escape(p.venue)}</strong> · ${p.year}</p>${p.note ? `<p class="paper-note">${escape(p.note)}</p>` : ''}<div class="tags" aria-label="Research areas">${p.tags.map(tag => `<span class="tag">${escape(tag)}</span>`).join('')}</div><div class="paper-links">${resources}</div>${p.bibtex ? `<details class="paper-details citation"><summary>BibTeX</summary><button type="button" class="copy-button" data-citation="cite-${p.id}" hidden>Copy BibTeX</button><pre id="cite-${p.id}">${escape(p.bibtex.trim())}</pre>${link(`/publication/${p.id}/cite.bib`, 'Download .bib')}</details>` : ''}${p.summary ? `<details class="paper-details"><summary>About this paper</summary><p>${escape(p.summary)}</p></details>` : ''}</div></article>`;
}
const formatMonth = date => new Date(`${date.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const newsRow = item => `<li class="news-row"><time datetime="${item.date}">${formatMonth(item.date)}</time><div>${link(item.url, escape(item.title))}<p class="muted">${escape(item.summary)}</p>${item.url.includes("/olympics/") ? '<details class="paper-details"><summary>Competition timeline and example scenario</summary><img src="/news/cpm-olympics/timeline.png" alt="CPM Olympics competition timeline" loading="lazy"><video controls preload="none" aria-label="CPM Olympics example motion-planning scenario"><source src="/news/cpm-olympics/scenario-example.mp4" type="video/mp4"><a href="/news/cpm-olympics/scenario-example.mp4">Download scenario video</a></video></details>' : ''}</div></li>`;
const sortedNews = [...news].sort((a,b) => b.date.localeCompare(a.date));
// Keep the latest announcement visible; the archive grows naturally as entries are added.
const recentNewsCount = 1;
const newsHTML = `<ul class="news-list">${sortedNews.slice(0, recentNewsCount).map(newsRow).join('')}</ul>${sortedNews.length > recentNewsCount ? `<details class="news-more"><summary>Show all news</summary><ul class="news-list">${sortedNews.slice(recentNewsCount).map(newsRow).join('')}</ul></details>` : ''}`;
const filterButtons = (group, entries) => entries.map(([value, label]) => `<button type="button" class="filter-button" data-group="${group}" data-value="${value}" aria-pressed="${value === 'all'}" aria-controls="publications">${label}</button>`).join('');
const entries = items => `<ul class="entry-list">${items.map(item => `<li class="entry"><p class="entry-date">${escape(item.date)}</p><div><h3>${item.url ? link(item.url, escape(item.title)) : escape(item.title)}</h3><p>${escape(item.organization)}</p><p class="entry-detail">${escape(item.description)}</p></div></li>`).join('')}</ul>`;
const education = `<ul class="entry-list">${profile.education.map(item => `<li class="entry"><p class="entry-date">${formatMonth(item.date_start)} –<br>${formatMonth(item.date_end)}${item.area.startsWith('Ph.D.') ? ' (expected)' : ''}</p><div><h3>${escape(item.area)}</h3><p>${escape(item.institution)}</p><p class="entry-detail">${markdown(item.summary.trim())}</p></div></li>`).join('')}</ul>`;
const supervision = (kind, title) => {
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
  STATUS_FILTERS: filterButtons('type', [['all','All'],['selected','★ Selected'],['peer-reviewed','Peer-reviewed'],['preprint','Preprints']]),
  AREA_FILTERS: filterButtons('area', [['all','All'],['MARL','MARL'],['Safe Control','Safe Control'],['CAVs','CAVs'],['Robotics','Robotics']]),
  EDUCATION: education,
  EXPERIENCE: entries(profile.experience),
  AWARDS: `<ul class="award-list">${profile.awards.map(item => `<li><span class="award-year">${item.date.slice(0,4)}</span><div><strong>${escape(item.title)}</strong><p class="awarder">${escape(item.awarder)}</p><details class="paper-details"><summary>Award details</summary><p>${escape(item.summary.trim())}</p></details></div></li>`).join('')}</ul>`,
  TALKS: entries(profile.talks),
  TEACHING: supervision('theses','Supervised theses') + supervision('seminar','Supervised seminar works'),
  SERVICE: entries(profile.service),
  YEAR: new Date().getFullYear(),
};
let html = await read('site/templates/index.html');
for (const [key, value] of Object.entries(replacements)) html = html.replace(`{{${key}}}`, value);
if (/\{\{\w+\}\}/.test(html)) throw Error('Unresolved template field');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(path.join(root,'site/assets'), path.join(out,'assets'), { recursive: true });
await mkdir(path.join(out,'uploads'), { recursive: true });
await cp(path.join(root,'static/uploads/resume.pdf'), path.join(out,'uploads/resume.pdf'));
if (process.env.SITE_PREVIEW === 'true') html = html.replace('</head>', '<meta name="robots" content="noindex, nofollow"></head>');
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
for (const [source, dest] of [['content/news/cpm-olympics/scenario-example.mp4','news/cpm-olympics/scenario-example.mp4'],['content/news/cpm-olympics/timeline.png','news/cpm-olympics/timeline.png'],['content/teaching/cpnav/lab-architecture.png','teaching/cpnav/lab-architecture.png']]) await cp(path.join(root,source),path.join(out,dest));
console.log(`Built ${publications.length} publications, ${news.length} news entries, ${profile.awards.length} awards, ${teaching.theses.length} theses, and ${teaching.seminar.length} seminar works → dist/`);
