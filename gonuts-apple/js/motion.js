import { litCount, scrollProgress, tiltAngles } from './lib/motion.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Fade sections in as they scroll into view. */
export function reveal() {
  const nodes = document.querySelectorAll('.rv');
  if (reduce || !('IntersectionObserver' in window)) { nodes.forEach((n) => n.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.1 });
  nodes.forEach((n) => io.observe(n));
}

/** The statement's words light up as you scroll past them. */
export function litWords(id = 'words') {
  const el = document.getElementById(id);
  if (!el) return;
  const spans = el.textContent.trim().split(/\s+/).map((w) => { const s = document.createElement('span'); s.textContent = w; return s; });
  el.replaceChildren(...spans.flatMap((s, i) => (i ? [' ', s] : [s])));
  const update = () => {
    const lit = reduce ? spans.length : litCount(scrollProgress(el.getBoundingClientRect().top, el.offsetHeight, innerHeight), spans.length);
    spans.forEach((s, i) => s.classList.toggle('lit', i < lit));
  };
  addEventListener('scroll', update, { passive: true }); addEventListener('resize', update); update();
}

/** The hero window leans toward the pointer. */
export function tilt(areaId = 'stage', cardId = 'device') {
  const area = document.getElementById(areaId), card = document.getElementById(cardId);
  if (!area || !card || reduce) return;
  area.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const r = area.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height, a = tiltAngles(x, y);
    card.style.setProperty('--rx', `${a.rx + 4}deg`); card.style.setProperty('--ry', `${a.ry}deg`);
    card.style.setProperty('--mx', `${x * 100}%`); card.style.setProperty('--my', `${y * 100}%`);
  });
  area.addEventListener('pointerleave', () => ['--rx', '--ry', '--mx', '--my'].forEach((p) => card.style.removeProperty(p)));
}
