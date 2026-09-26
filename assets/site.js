import { matchesPublication, readFilters } from './filters.js';

// Keep anchors clear of the header when navigation wraps or text is enlarged.
const header = document.querySelector('.site-header');
const updateHeaderHeight = () => {
  document.documentElement.style.setProperty('--header-height', `${header.getBoundingClientRect().height}px`);
};
updateHeaderHeight();
new ResizeObserver(updateHeaderHeight).observe(header);

const filterPanel = document.querySelector('#publication-filters');
const buttons = [...filterPanel.querySelectorAll('button')];
const publications = [...document.querySelectorAll('.publication')].map(element => ({
  element,
  selected: element.dataset.selected === 'true',
  status: element.dataset.status,
  tags: element.dataset.tags.split('|'),
}));
let filters = readFilters(location.search);

function applyFilters(updateURL = false) {
  let count = 0;
  for (const publication of publications) {
    const visible = matchesPublication(publication, filters.type, filters.area);
    publication.element.hidden = !visible;
    if (visible) count++;
  }
  for (const button of buttons) {
    button.setAttribute('aria-pressed', String(filters[button.dataset.group] === button.dataset.value));
  }
  document.querySelector('#publication-count').textContent = `${count} of ${publications.length} publications`;
  document.querySelector('#empty-results').hidden = count !== 0;
  if (updateURL) {
    const url = new URL(location.href);
    for (const key of ['type', 'area']) {
      if (filters[key] === 'all') url.searchParams.delete(key);
      else url.searchParams.set(key, filters[key]);
    }
    history.replaceState(null, '', url);
  }
}

filterPanel.hidden = false;
filterPanel.addEventListener('click', event => {
  const button = event.target.closest('button[data-group]');
  if (!button) return;
  filters[button.dataset.group] = button.dataset.value;
  applyFilters(true);
});
document.querySelector('#reset-filters').addEventListener('click', () => {
  filters = { type: 'all', area: 'all' };
  applyFilters(true);
  buttons[0].focus();
});
window.addEventListener('popstate', () => {
  filters = readFilters(location.search);
  applyFilters();
});
applyFilters();

for (const button of document.querySelectorAll('.copy-button')) {
  button.hidden = false;
  button.addEventListener('click', async () => {
    const citation = document.getElementById(button.dataset.citation);
    try {
      await navigator.clipboard.writeText(citation.textContent);
      button.textContent = 'Copied';
    } catch {
      button.textContent = 'Select and copy the citation below';
      const range = document.createRange();
      range.selectNodeContents(citation);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  });
}
const newsDisclosure = document.querySelector('.news-more');
if (newsDisclosure) {
  newsDisclosure.addEventListener('toggle', () => {
    newsDisclosure.querySelector('summary').textContent = newsDisclosure.open ? 'Show less news' : 'Show all news';
  });
}
// Keep incoming links from the former homepage useful.
const legacyAnchors = { biography: 'education', publications: 'research', projects: 'research', home: 'about' };
if (legacyAnchors[location.hash.slice(1)]) {
  location.replace(`${location.pathname}${location.search}#${legacyAnchors[location.hash.slice(1)]}`);
}
// A shared link to a publication should reveal it even when a filter is present.
const linkedPaper = document.getElementById(location.hash.slice(1));
if (linkedPaper?.classList.contains('publication') && linkedPaper.hidden) {
  filters = { type: 'all', area: 'all' };
  applyFilters(true);
  linkedPaper.scrollIntoView();
}

if (linkedPaper instanceof HTMLDetailsElement) {
  linkedPaper.open = true;
}
