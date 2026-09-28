import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { matchesPublication, readFilters } from '../assets/filters.js';
const publications = JSON.parse(await readFile(new URL('../data/publications.json', import.meta.url)));
const html = await readFile(new URL('../dist/index.html', import.meta.url),'utf8');

test('selection and tag filters intersect and preserve old shared links', () => {
  const paper = { selected:true, status:'preprint', tags:['Learning','CAVs'] };
  assert.equal(matchesPublication(paper,'selected','CAVs'),true);
  assert.equal(matchesPublication({...paper, selected:false},'selected','CAVs'),false);
  assert.equal(matchesPublication(paper,'all','Safe Control'),false);
  assert.equal(matchesPublication(paper,'all','all'),true);
  assert.deepEqual(readFilters('?type=selected&tag=Learning'),{type:'selected',tag:'Learning'});
  assert.deepEqual(readFilters('?type=preprint&area=Safe+Control'),{type:'all',tag:'Safe Control'});
  assert.deepEqual(readFilters('?area=MARL'),{type:'all',tag:'Learning'});
  assert.deepEqual(readFilters('?type=peer-reviewed&area=Robotics'),{type:'all',tag:'all'});
  assert.deepEqual(readFilters('?type=unknown&tag=unknown'),{type:'all',tag:'all'});
});
test('only the requested filters and tags are rendered', () => {
  const types = [...html.matchAll(/data-group="type" data-value="([^"]+)"/g)].map(m=>m[1]);
  const tags = [...html.matchAll(/data-group="tag" data-value="([^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual(types,['all','selected']);
  assert.deepEqual(tags,['all','Learning','Safe Control','CAVs']);
  for (const tag of tags) assert.ok(publications.some(p=>matchesPublication(p,'all',tag)));
  assert.ok(publications.every(p=>p.tags.every(tag=>tags.includes(tag))));
  assert.equal((html.match(/class="preprint-badge"/g)||[]).length,publications.filter(p=>p.status==='preprint').length);
  for (const id of ['xu-2026-safety','xu-2025-learningbased','xu-2025-realtime']) assert.ok(publications.find(p=>p.id===id).tags.includes('Learning'));
});
test('CAVs excludes single-robot and single-vehicle studies', () => {
  for (const id of ['xu-2026-ttcbf','xu-2025-highorder','xu-2025-realtime']) assert.ok(!publications.find(p=>p.id===id).tags.includes('CAVs'));
});
test('all source publications and citations are preserved in static HTML', async () => {
  assert.equal((html.match(/<article class="publication"/g)||[]).length,publications.length);
  for (const p of publications) {
    assert.ok(html.includes(`id="${p.id}"`));
    await access(new URL(`../dist/publication/${p.id}/index.html`,import.meta.url));
    if (p.bibtex) assert.equal(await readFile(new URL(`../dist/publication/${p.id}/cite.bib`,import.meta.url),'utf8'),p.bibtex);
  }
  assert.ok(publications.every(p => p.authors.includes('Jianye Xu')));
  assert.ok(!html.includes('kloock-2021-cyberphysical'));
  await assert.rejects(access(new URL('../dist/publication/kloock-2021-cyberphysical/index.html', import.meta.url)));
});
test('local assets and fragment targets resolve', async () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length);
  for (const [,url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (url.startsWith('#')) assert.ok(ids.includes(url.slice(1)),`Missing fragment ${url}`);
    else if (url.startsWith('/')) await access(new URL(`../dist${url}`,import.meta.url));
  }
});
test('publication buttons name their preprint server and publisher', () => {
  const researchGate = {
    'schafer-2024-educational': 'https://doi.org/10.13140/RG.2.2.34128.28161',
    'scheffe-2024-limiting': 'https://doi.org/10.13140/RG.2.2.32731.03368',
  };
  for (const p of publications) {
    const article = html.split(`<article class="publication" id="${p.id}"`)[1].split('</article>')[0];
    const resources = article.split('<div class="paper-links">')[1].split('</div>')[0];
    const links = [...resources.matchAll(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g)].map(([, href, label]) => ({ href, label }));
    const preprint = links[0];
    if (researchGate[p.id]) {
      assert.deepEqual(preprint, { href: researchGate[p.id], label: 'ResearchGate' });
    } else {
      assert.equal(preprint.label, 'arXiv');
      assert.equal(new URL(preprint.href).hostname, 'arxiv.org');
    }
    if (p.status === 'peer-reviewed' && p.links.publisher) {
      assert.ok(links.some(link => link.href === p.links.publisher && link.label === (p.id === 'beerwerth-2026-zeroshot' ? 'De Gruyter Brill' : 'IEEE')));
    } else {
      assert.ok(!links.some(link => ['IEEE', 'De Gruyter Brill'].includes(link.label)));
    }
    assert.ok(!links.some(link => ['Paper', 'Publisher'].includes(link.label)));
  }
});
test('page retains academic sections, supervision and expandable news without JavaScript', () => {
  for (const id of ['about','news','research','education','awards','talks','teaching','service']) assert.ok(html.includes(`id="${id}"`));
  assert.ok(html.includes('Supervised theses <span class="muted">(20)'));
  assert.ok(html.includes('Supervised seminar works <span class="muted">(14)'));
  assert.ok(html.includes('<details class="news-more">'));
  assert.ok(!html.includes('<details class="news-more" open'));
  assert.ok(html.includes('https://jianyexu.com/'));
  assert.ok(!html.includes('background-'));
});

test('preview serves the homepage and assets, and returns a real 404', async t => {
  const { spawn } = await import('node:child_process');
  const server = spawn(process.execPath,['scripts/serve.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:'0'}});
  t.after(()=>server.kill());
  const origin = await new Promise((resolve,reject)=>{
    server.once('error',reject);
    server.stdout.once('data',chunk=>resolve(chunk.toString().match(/http:\/\/127\.0\.0\.1:\d+/)[0]));
  });
  const home=await fetch(origin);
  assert.equal(home.status,200);
  assert.ok((await home.text()).includes('Research / Publications'));
  assert.equal((await fetch(`${origin}/assets/site.js`)).status,200);
  assert.equal((await fetch(`${origin}/missing-page`)).status,404);
});

test('CV and historical media URLs retain their original downloadable content', async () => {
  for (const [source, output] of [
    ['assets/resume.pdf', 'uploads/resume.pdf'],
    ['assets/cpm-scenario.mp4', 'news/cpm-olympics/scenario-example.mp4'],
    ['assets/cpm-timeline.png', 'news/cpm-olympics/timeline.png'],
    ['assets/lab-architecture.png', 'teaching/cpnav/lab-architecture.png'],
  ]) {
    assert.deepEqual(
      await readFile(new URL(`../dist/${output}`, import.meta.url)),
      await readFile(new URL(`../${source}`, import.meta.url)),
    );
  }
});

test('paper titles are plain headings and action-row disclosures target preserved content', () => {
  for (const p of publications) {
    const article = html.split(`<article class="publication" id="${p.id}"`)[1].split('</article>')[0];
    assert.ok(!article.match(/<h3[^>]*>[\s\S]*?<a[\s\S]*?<\/h3>/));
    const row = article.split('<div class="paper-links">')[1].split('</div>')[0];
    for (const [kind, content] of [['bibtex',p.bibtex],['about',p.summary]]) {
      assert.equal(row.includes(`aria-controls="${kind}-${p.id}"`),Boolean(content));
      if (content) assert.ok(article.includes(`id="${kind}-${p.id}"`));
    }
    if (p.bibtex) {
      const actions = article.split('<div class="citation-actions">')[1].split('</div>')[0];
      assert.ok(actions.includes('Download .bib'));
      assert.ok(actions.includes('Copy BibTeX'));
    }
  }
});

test('awards retain every entry with inline metadata and native details', async () => {
  const { awards } = JSON.parse(await readFile(new URL('../data/profile.json', import.meta.url)));
  const list = html.split('<ul class="award-list">')[1].split('</ul>')[0];
  const entries = [...list.matchAll(/<li>(.*?)<\/li>/g)].map(match => match[1]);
  assert.equal(entries.length, awards.length);
  for (const entry of entries) {
    const inlineContent = entry.split('<summary>')[1].split('</summary>')[0];
    assert.ok(inlineContent.includes('class="award-year"'));
    assert.ok(inlineContent.includes('<span class="awarder">'));
    assert.doesNotMatch(inlineContent, /<(?:p|div|br)\b/);
    assert.ok(entry.includes('<details class="award-details"><summary>'));
    assert.ok(!entry.includes('Award details'));
    assert.ok(entry.includes('</summary><p>'));
  }
});


test('talks and service preserve content and links in compact entries', async () => {
  const profile = JSON.parse(await readFile(new URL('../data/profile.json', import.meta.url)));
  const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  for (const section of ['talks', 'service']) {
    const content = html.split(`id="${section}"`)[1].split('</section>')[0];
    assert.ok(content.includes('class="entry-list compact-entries"'));
    assert.doesNotMatch(content, /<(?:p|br)\b/);
    for (const item of profile[section]) {
      for (const field of ['date', 'title', 'organization', 'description']) assert.ok(content.includes(escape(item[field])));
      if (item.url) assert.ok(content.includes(`href="${escape(item.url)}"`));
    }
  }
});

test('supervised theses show year, student, and title in order and preserve details', async () => {
  const { theses } = JSON.parse(await readFile(new URL('../data/teaching.json', import.meta.url)));
  const list = html.split('<ul class="award-list thesis-list">')[1].split('</ul>')[0];
  const entries = [...list.matchAll(/<li>(.*?)<\/li>/g)].map(match => match[1]);
  assert.equal(entries.length, theses.length);
  const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  for (const [index, item] of theses.entries()) {
    const entry = entries[index];
    const summary = entry.split('<summary>')[1].split('</summary>')[0];
    const text = summary.replace(/<[^>]+>/g, '');
    assert.equal(text, `${escape(item.year)} ${escape(item.student)} · ${escape(item.title)}`);
    assert.doesNotMatch(summary, /<(?:br|p|div)\b/);
    assert.ok(entry.includes(`<p>${escape(item.details)}</p>`));
  }
});
