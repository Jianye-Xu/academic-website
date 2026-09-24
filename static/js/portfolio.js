document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.sidebar-toggle');
  const sidebar = document.querySelector('.portfolio-sidebar');
  if (!toggle || !sidebar) return;
  const navLinks = [...sidebar.querySelectorAll('.sidebar-nav a')];
  const homePath = new URL(navLinks[0].href).pathname;
  const sections = [...document.querySelectorAll('main > section[id]')];

  function setActive(hash) {
    navLinks.forEach(link => {
      const active = new URL(link.href).hash === hash;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }

  function updateActiveSection() {
    if (window.location.pathname !== homePath) {
      const sectionByPath = { news: '#news', projects: '#projects', publication: '#publications', teaching: '#teaching', awards: '#awards' };
      const pageSection = window.location.pathname.split('/').filter(Boolean)[0];
      setActive(sectionByPath[pageSection] || '');
      return;
    }

    const marker = window.scrollY + window.innerHeight * 0.35;
    let active = '#top';
    sections.forEach(section => {
      if (section.offsetTop <= marker) active = `#${section.id}`;
    });
    setActive(active);
  }

  let updatePending = false;
  function scheduleActiveUpdate() {
    if (updatePending) return;
    updatePending = true;
    window.requestAnimationFrame(() => {
      updateActiveSection();
      updatePending = false;
    });
  }

  function closeMenu() {
    sidebar.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
    toggle.textContent = '☰';
  }

  toggle.addEventListener('click', () => {
    const open = sidebar.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    toggle.textContent = open ? '×' : '☰';
  });
  sidebar.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });
  window.addEventListener('scroll', scheduleActiveUpdate, { passive: true });
  window.addEventListener('resize', scheduleActiveUpdate);
  window.addEventListener('load', scheduleActiveUpdate);
  scheduleActiveUpdate();
});
