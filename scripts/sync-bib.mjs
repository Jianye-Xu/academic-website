// Sync abstracts from the Zotero export (zotero.bib) into data/publications.json.
// Matches papers by BibTeX key (the paper id). Existing papers only get
// their abstract refreshed; new keys are reported, since tags, links, and figures need a human.
import { readFileSync, writeFileSync } from 'node:fs';

const jsonPath = new URL('../data/publications.json', import.meta.url);
const publications = JSON.parse(readFileSync(jsonPath, 'utf8'));
const bib = readFileSync(new URL('../zotero.bib', import.meta.url), 'utf8');

const cleanTex = s => s.replace(/\\%/g, '%').replace(/\\&/g, '&').replace(/``/g, '“').replace(/''/g, '”').replace(/--/g, '–').replace(/\s+/g, ' ').trim();
const entries = new Map();
for (const [, key, body] of bib.matchAll(/@\w+\{([^,\s]+),([\s\S]*?)\n\}/g)) {
  const abstract = body.match(/\n\s*abstract\s*=\s*\{([\s\S]*?)\},?\s*(?:\n\s*\w+\s*=|$)/);
  entries.set(key, abstract ? cleanTex(abstract[1]) : '');
}

const known = new Set(publications.map(p => p.id));
let updated = 0;
for (const p of publications) {
  const abstract = entries.get(p.id);
  if (abstract === undefined) { console.warn(`Not in zotero.bib: ${p.id}`); continue; }
  if (!abstract) { console.warn(`No abstract in Zotero: ${p.id}`); continue; }
  if (p.abstract !== abstract) { p.abstract = abstract; updated++; }
}
writeFileSync(jsonPath, JSON.stringify(publications, null, 2) + '\n');
console.log(`Updated ${updated} abstract(s).`);
for (const key of entries.keys()) if (!known.has(key)) console.log(`New in Zotero, add to data/publications.json: ${key}`);
