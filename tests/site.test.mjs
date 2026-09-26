import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { matchesPublication, readFilters } from '../assets/filters.js';
const publications = JSON.parse(await readFile(new URL('../data/publications.json', import.meta.url)));
const html = await readFile(new URL('../dist/index.html', import.meta.url),'utf8');

test('filters intersect selection/status with area and recover invalid query values', () => {
  const paper = { selected:true, status:'preprint', tags:['Safe Control','CAVs'] };
  assert.equal(matchesPublication(paper,'selected','CAVs'),true);
  assert.equal(matchesPublication(paper,'peer-reviewed','CAVs'),false);
  assert.equal(matchesPublication(paper,'preprint','Robotics'),false);
  assert.equal(matchesPublication(paper,'all','all'),true);
  assert.deepEqual(readFilters('?type=preprint&area=Safe+Control'),{type:'preprint',area:'Safe Control'});
  assert.deepEqual(readFilters('?type=unknown&area=unknown'),{type:'all',area:'all'});
});
test('every requested filter has real matching content', () => {
  for (const type of ['all','selected','peer-reviewed','preprint']) assert.ok(publications.some(p=>matchesPublication(p,type,'all')));
  for (const area of ['MARL','Safe Control','CAVs','Robotics']) assert.ok(publications.some(p=>matchesPublication(p,'all',area)));
  assert.equal(publications.filter(p=>p.status==='preprint').length,3);
});
test('all source publications and citations are preserved in static HTML', async () => {
  assert.equal((html.match(/<article class="publication"/g)||[]).length,13);
  for (const p of publications) {
    assert.ok(html.includes(`id="${p.id}"`));
    await access(new URL(`../dist/publication/${p.id}/index.html`,import.meta.url));
    if (p.bibtex) assert.equal(await readFile(new URL(`../dist/publication/${p.id}/cite.bib`,import.meta.url),'utf8'),p.bibtex);
  }
  assert.ok(html.includes('Jianye Xu is not listed as an author'));
});
test('local assets and fragment targets resolve', async () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length);
  for (const [,url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (url.startsWith('#')) assert.ok(ids.includes(url.slice(1)),`Missing fragment ${url}`);
    else if (url.startsWith('/')) await access(new URL(`../dist${url}`,import.meta.url));
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
