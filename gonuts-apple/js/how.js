import { nearestIndex } from './lib/motion.js';
import { onFrame } from './motion.js';

/** "How it works": the step nearest the middle of the screen is the active one, and the sticky panel follows it. */
export function wireHow() {
  const steps = [...document.querySelectorAll('.how-step')];
  const img = document.getElementById('how-img'), cap = document.getElementById('how-cap'), dots = [...document.querySelectorAll('.dots li')];
  if (!steps.length || !img) return;
  let current = -1;
  const update = () => {
    const i = nearestIndex(steps.map((s) => { const r = s.getBoundingClientRect(); return r.top + r.height / 2; }), innerHeight / 2);
    if (i === current) return;
    current = i;
    steps.forEach((s, k) => s.classList.toggle('on', k === i));
    dots.forEach((d, k) => d.classList.toggle('on', k === i));
    const s = steps[i];
    img.src = s.dataset.img; cap.textContent = s.dataset.cap;
  };
  onFrame(update);
}
