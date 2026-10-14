import { activeSection, pageProgress } from './lib/motion.js';
import { onFrame } from './motion.js';

/** Scroll progress bar, scrollspy on the nav links, and the mobile menu. */
export function wireNav() {
  const bar = document.querySelector('.progress');
  const nav = document.querySelector('.gnav');
  const button = document.querySelector('.menu-btn');
  const links = [...document.querySelectorAll('.gnav-links a[href^="/#"]')];
  const sections = links.map((a) => document.getElementById(a.getAttribute('href').slice(2)));

  const update = () => {
    bar?.style.setProperty('--p', pageProgress(scrollY, document.documentElement.scrollHeight, innerHeight).toFixed(4));
    if (!sections.every(Boolean)) return;
    const now = activeSection(sections.map((s) => s.getBoundingClientRect().top), 120);
    const inside = now >= 0 && sections[now].getBoundingClientRect().bottom > 120;
    links.forEach((a, i) => (i === now && inside ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
  };
  onFrame(update);

  if (!button || !nav) return;
  const set = (open) => { nav.classList.toggle('open', open); button.setAttribute('aria-expanded', String(open)); };
  button.addEventListener('click', () => set(!nav.classList.contains('open')));
  links.forEach((a) => a.addEventListener('click', () => set(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
}
