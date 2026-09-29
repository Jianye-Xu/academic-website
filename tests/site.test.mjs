import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { matchesPublication, readFilters } from '../assets/filters.js';
import { SIZE, SAFE_DISTANCE, layoutZones, createFleet, stepFleet } from '../assets/fleet.js';
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
  for (const id of ['xu2026safety','xu2025learningbased','xu2025realtime']) assert.ok(publications.find(p=>p.id===id).tags.includes('Learning'));
});
test('CAVs excludes single-robot and single-vehicle studies', () => {
  for (const id of ['xu2026ttcbf','xu2025highorder','xu2025realtime']) assert.ok(!publications.find(p=>p.id===id).tags.includes('CAVs'));
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
    'schafer2024educational': 'https://doi.org/10.13140/RG.2.2.34128.28161',
    'scheffe2024limiting': 'https://doi.org/10.13140/RG.2.2.32731.03368',
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
      assert.ok(links.some(link => link.href === p.links.publisher && link.label === (p.id === 'beerwerth2026zeroshot' ? 'De Gruyter Brill' : 'IEEE')));
    } else {
      assert.ok(!links.some(link => ['IEEE', 'De Gruyter Brill'].includes(link.label)));
    }
    assert.ok(!links.some(link => ['Paper', 'Publisher'].includes(link.label)));
  }
});
test('page retains academic sections, supervision and scrollable news and publications without JavaScript', () => {
  for (const id of ['about','news','research','education','awards','talks','teaching','service']) assert.ok(html.includes(`id="${id}"`));
  assert.ok(html.includes('Supervised theses <span class="muted">(20)'));
  assert.ok(html.includes('Supervised seminar works <span class="muted">(14)'));
  assert.ok(html.includes('class="news-scroll"'));
  assert.ok(html.includes('class="publication-scroll" role="region"'));
  assert.ok(!html.includes('news-more'));
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
  assert.ok((await home.text()).includes('Publications'));
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
    for (const [kind, content] of [['bibtex',p.bibtex],['abstract',p.abstract]]) {
      assert.equal(row.includes(`aria-controls="${kind}-${p.id}"`),Boolean(content));
      if (content) assert.ok(article.includes(`id="${kind}-${p.id}"`));
    }
    if (p.bibtex) {
      const bar = article.split('<div class="citation-bar">')[1].split('</div>')[0];
      assert.ok(bar.includes(`data-citation="cite-${p.id}"`));
      assert.ok(bar.includes('aria-label="Copy BibTeX"'));
      assert.ok(!article.includes('Download .bib'));
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
      for (const field of ['date', 'title', 'organization']) assert.ok(content.includes(escape(item[field])));
      const rendered = escape(item.description).replace(/\[([^\]]+)\]\((https:\/\/[^)]+)\)/g, '<a href="$2">$1</a>');
      assert.ok(content.includes(rendered));
      assert.equal(item.url, undefined);
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


test('CV section order and Professional Activities hierarchy are preserved', () => {
  const headings = [...html.matchAll(/<h2 id="[^"]+">([^<]+)<\/h2>/g)].map(match => match[1]);
  assert.deepEqual(headings, ['News', 'Publications', 'Education', 'Awards', 'Professional Activities', 'Teaching and Mentoring']);
  const activities = html.split('id="professional-activities"')[1].split('<section id="teaching"')[0];
  const subheadings = [...activities.matchAll(/<h3 class="subheading" id="[^"]+">([^<]+)<\/h3>/g)].map(match => match[1]);
  assert.deepEqual(subheadings, ['Program Committee', 'Invited Talks', 'Journal Reviewing', 'Conference Reviewing', 'Membership']);
  for (const text of ['Associate Editor', 'Automatica', 'IEEE Control Systems Letters (L-CSS)', 'IEEE International Conference on Robotics and Automation (ICRA)', 'Graduate Student Member, IEEE', 'IEEE Young Professionals']) assert.ok(activities.includes(text));
  assert.ok(!activities.includes('Guest Lecturer'));
  const teaching = html.split('<section id="teaching"')[1];
  for (const title of ['Assistant Lecturer', 'Guest Lecturer', 'Research Assistant', 'Undergraduate Teaching Assistant']) assert.ok(teaching.includes(title));
  assert.equal((html.match(/>Assistant Lecturer</g) || []).length, 1);
  assert.equal((html.match(/>Guest Lecturer</g) || []).length, 1);
});

test('background robots pair a Classic robot and a robot dog per margin and keep a safe distance', () => {
  assert.ok(html.includes('<script type="module" src="/assets/robots.js"></script>'));
  assert.ok(html.includes('<button type="button" class="motion-toggle" hidden>Pause animation</button>'));
  assert.deepEqual(layoutZones(1280, 900, 110, 1170), []);
  const zones = layoutZones(1440, 900, 190, 1250);
  assert.equal(zones.length, 2);
  const pad = SIZE * 0.45;
  assert.ok(zones[0].x0 - pad >= 12 && zones[0].x1 + pad <= 190 - 16);
  assert.ok(zones[1].x0 - pad >= 1250 + 16 && zones[1].x1 + pad <= 1440 - 12);
  for (const zone of zones) {
    assert.equal(zone.y1, 900 - 40);
    assert.ok(Math.abs(zone.y1 + SIZE * 0.59 - (zone.y0 - SIZE * 0.52) - 250) < 1e-9);
  }
  const robots = createFleet(zones);
  assert.deepEqual(robots.map(r => `${r.zone}:${r.kind}`), ['0:classic', '0:dog', '1:classic', '1:dog']);
  let closest = Infinity;
  for (let t = 0; t < 600; t += 1 / 30) {
    stepFleet(robots, zones, 1 / 30, t);
    for (const zone of [0, 1]) {
      const [a, b] = robots.filter(r => r.zone === zone);
      closest = Math.min(closest, Math.hypot(a.x - b.x, a.y - b.y));
    }
  }
  assert.ok(closest > SAFE_DISTANCE - 1, `closest distance ${closest}`);
  for (const r of robots) {
    const z = zones[r.zone];
    assert.ok(r.x >= z.x0 && r.x <= z.x1 && r.y >= z.y0 && r.y <= z.y1);
    assert.ok(r.travel > 100);
  }
});
