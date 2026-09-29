import { matchesPublication, readFilters } from './filters.js';

// Keep anchors clear of the header when navigation wraps or text is enlarged.
const header = document.querySelector('.site-header');
const updateHeaderHeight = () => {
  document.documentElement.style.setProperty('--header-height', `${header.getBoundingClientRect().height}px`);
};
updateHeaderHeight();
new ResizeObserver(updateHeaderHeight).observe(header);

// Fade the bottom edge of a scroll window while more content lies below it,
// since overlay scrollbars give no hint that the window scrolls.
const scrollWindows = [...document.querySelectorAll('.news-scroll, .publication-scroll')];
const updateScrollHint = element => {
  element.toggleAttribute('data-more', element.scrollTop + element.clientHeight < element.scrollHeight - 2);
};
for (const element of scrollWindows) {
  updateScrollHint(element);
  element.addEventListener('scroll', () => updateScrollHint(element), { passive: true });
  new ResizeObserver(() => updateScrollHint(element)).observe(element);
  element.addEventListener('toggle', () => updateScrollHint(element), true);
}

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
    const visible = matchesPublication(publication, filters.type, filters.tag);
    publication.element.hidden = !visible;
    if (visible) count++;
  }
  for (const button of buttons) {
    button.setAttribute('aria-pressed', String(filters[button.dataset.group] === button.dataset.value));
  }
  document.querySelector('#publication-count').textContent = `${count} of ${publications.length} publications`;
  document.querySelector('#empty-results').hidden = count !== 0;
  scrollWindows.forEach(updateScrollHint);
  if (updateURL) {
    document.querySelector('#publications').scrollTop = 0;
    const url = new URL(location.href);
    url.searchParams.delete('area');
    for (const key of ['type', 'tag']) {
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
  filters = { type: 'all', tag: 'all' };
  applyFilters(true);
  buttons[0].focus();
});
window.addEventListener('popstate', () => {
  filters = readFilters(location.search);
  applyFilters();
});
applyFilters();

// Keep disclosure controls in the shared action row while retaining native
// details/summary access when JavaScript is unavailable. Only one paper panel
// is open at a time, and the clicked paper stays put when another one closes.
const disclosureButtons = [...document.querySelectorAll('.disclosure-button')];
const panelOf = button => document.getElementById(button.getAttribute('aria-controls'));
const scrollerOf = element => element.closest('.publication-scroll');
for (const button of disclosureButtons) {
  const panel = panelOf(button);
  panel.querySelector('summary').hidden = true;
  button.hidden = false;
  button.setAttribute('aria-expanded', String(panel.open));
  button.addEventListener('click', () => {
    const opening = !panel.open;
    const top = button.getBoundingClientRect().top;
    if (opening) {
      for (const other of disclosureButtons) {
        if (other !== button) panelOf(other).open = false;
      }
    }
    panel.open = opening;
    const shift = button.getBoundingClientRect().top - top;
    const scroller = scrollerOf(button);
    if (shift && scroller && scroller.scrollHeight > scroller.clientHeight) scroller.scrollTop += shift;
    else if (shift) window.scrollBy(0, shift);
  });
  panel.addEventListener('toggle', () => {
    button.setAttribute('aria-expanded', String(panel.open));
  });
  panel.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    panel.open = false;
    button.focus();
  });
}
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || !event.target.classList?.contains('disclosure-button')) return;
  panelOf(event.target).open = false;
});

for (const button of document.querySelectorAll('.copy-button')) {
  const label = button.querySelector('span');
  let reset;
  const flash = (text, ms) => {
    label.textContent = text;
    clearTimeout(reset);
    reset = setTimeout(() => { label.textContent = 'Copy'; }, ms);
  };
  button.hidden = false;
  button.addEventListener('click', async () => {
    const citation = document.getElementById(button.dataset.citation);
    try {
      await navigator.clipboard.writeText(citation.textContent);
      flash('Copied ✓', 2000);
    } catch {
      flash('Selected, press Ctrl/⌘+C', 5000);
      const range = document.createRange();
      range.selectNodeContents(citation);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  });
}
// Keep incoming links from the former homepage useful.
const legacyAnchors = { biography: 'education', publications: 'research', projects: 'research', home: 'about',
  // Paper anchors used to be hyphenated; they are now the Zotero BibTeX keys.
  'xu-2026-ttcbf': 'xu2026ttcbf',
  'beerwerth-2026-zeroshot': 'beerwerth2026zeroshot',
  'xu-2026-safety': 'xu2026safety',
  'xu-2026-smallscale': 'xu2026smallscale',
  'xu-2025-highorder': 'xu2025highorder',
  'xu-2025-learningbased': 'xu2025learningbased',
  'xu-2025-realtime': 'xu2025realtime',
  'mokhtarian-2024-survey': 'mokhtarian2024survey',
  'schafer-2024-educational': 'schafer2024educational',
  'scheffe-2024-limiting': 'scheffe2024limiting',
  'xu-2024-sigmarl': 'xu2024sigmarl',
  'xu-2024-xpmarl': 'xu2024xpmarl' };
if (legacyAnchors[location.hash.slice(1)]) {
  location.replace(`${location.pathname}${location.search}#${legacyAnchors[location.hash.slice(1)]}`);
}
// A shared link to a publication should reveal it even when a filter is present.
const linkedPaper = document.getElementById(location.hash.slice(1));
if (linkedPaper?.classList.contains('publication') && linkedPaper.hidden) {
  filters = { type: 'all', tag: 'all' };
  applyFilters(true);
  linkedPaper.scrollIntoView();
}

if (linkedPaper instanceof HTMLDetailsElement) {
  linkedPaper.open = true;
}

// Enhance native click/keyboard disclosures with mouse hover previews.
for (const details of document.querySelectorAll('.award-details')) {
  let openedByHover = false;
  details.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse' || details.open) return;
    openedByHover = true;
    details.open = true;
  });
  // Keep the mouse preview next to the pointer, clamped to the viewport.
  details.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || !openedByHover) return;
    const width = Math.min(420, window.innerWidth - 24);
    details.classList.add('follow');
    details.style.setProperty('--tip-x', `${Math.max(12, Math.min(event.clientX + 14, window.innerWidth - width - 12))}px`);
    details.style.setProperty('--tip-y', `${event.clientY + 18}px`);
  });
  details.addEventListener('pointerleave', () => {
    if (openedByHover) details.open = false;
    openedByHover = false;
    details.classList.remove('follow');
  });
  details.querySelector('summary').addEventListener('focus', event => {
    if (event.target.matches(':focus-visible')) details.open = true;
  });
  details.addEventListener('focusout', () => {
    details.open = false;
    details.classList.remove('follow');
    openedByHover = false;
  });
  details.querySelector('summary').addEventListener('click', () => {
    openedByHover = false;
    details.classList.remove('follow');
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      details.open = false;
      openedByHover = false;
    }
  });
}
