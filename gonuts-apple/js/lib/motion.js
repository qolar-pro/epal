/* Pure helpers for the motion code, kept free of the DOM so they can be unit-tested. */

/** How many of `total` words are lit when the block has scrolled `progress` (0..1) through the viewport. */
export function litCount(progress, total) {
  const p = Math.min(1, Math.max(0, progress));
  return Math.min(total, Math.ceil(p * 1.05 * total));
}

/** Scroll progress of an element: 0 when its top is at 80% of the viewport height, 1 once it has passed through. */
export function scrollProgress(rectTop, rectHeight, viewportHeight) {
  return (viewportHeight * 0.8 - rectTop) / (rectHeight + viewportHeight * 0.25);
}

/** Tilt angles in degrees for a pointer at (x, y), each 0..1, inside the element. */
export function tiltAngles(x, y, max = { rx: 10, ry: 14 }) {
  const cl = (v) => Math.min(1, Math.max(0, v));
  return { rx: (0.5 - cl(y)) * max.rx, ry: (cl(x) - 0.5) * max.ry };
}

/** Index of the element whose centre is closest to `y` (used for the sticky "how it works" steps). -1 for an empty list. */
export function nearestIndex(centers, y) {
  let best = -1, bestDist = Infinity;
  centers.forEach((c, i) => { const d = Math.abs(c - y); if (d < bestDist) { best = i; bestDist = d; } });
  return best;
}

/** Index of the last section whose top is at or above `line`, or -1 before the first (scrollspy). */
export function activeSection(tops, line) {
  let current = -1;
  tops.forEach((t, i) => { if (t <= line) current = i; });
  return current;
}

/** 0..1 page scroll progress. */
export function pageProgress(scrollY, scrollHeight, viewportHeight) {
  const range = scrollHeight - viewportHeight;
  return range > 0 ? Math.min(1, Math.max(0, scrollY / range)) : 0;
}
