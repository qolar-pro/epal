/* Inline SVG icons (stroke style) and the pixel donut sprite. Pure string builders, used by build.js. */
const PATHS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.6-4.6"/>',
  cart: '<path d="M3 4h2.5l2 11h10l2-8H6.6"/><circle cx="9" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/>',
  refresh: '<path d="M20.5 12a8.5 8.5 0 0 1-14.6 5.9"/><path d="M3.5 12A8.5 8.5 0 0 1 18.1 6.1"/><path d="M18.5 2.5v4h-4"/><path d="M5.5 21.5v-4h4"/>',
  zap: '<path d="M13 2.5L4.5 13.5H11l-1 8 8.5-11H12z"/>',
  plug: '<path d="M9 2.5v5M15 2.5v5"/><path d="M6 7.5h12v3.5a6 6 0 0 1-12 0z"/><path d="M12 17v4.5"/>',
  swap: '<path d="M4 8h14"/><path d="M14 4l4 4-4 4"/><path d="M20 16H6"/><path d="M10 12l-4 4 4 4"/>',
  shield: '<path d="M12 3l7.5 2.8v5.7c0 4.6-3.2 7.8-7.5 9.5-4.3-1.7-7.5-4.9-7.5-9.5V5.8z"/><path d="M8.6 12l2.6 2.6 4.4-5"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1"/><circle cx="17.5" cy="9" r="2.4"/><path d="M17.5 14a4 4 0 0 1 3.5 4v1"/>',
  chat: '<path d="M4 5.5h16v11H10l-5 4v-4H4z"/><path d="M8 10h8M8 13h5"/>',
  download: '<path d="M12 3v12"/><path d="M7.5 10.5L12 15l4.5-4.5"/><path d="M4 20h16"/>',
  play: '<path d="M8 5.5v13l11-6.5z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
};
export const icon = (name, cls = 'ic') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${PATHS[name]}</svg>`;
export const iconNames = Object.keys(PATHS);

/* 12x12 pixel donut. K outline, B dough, P icing, S sprinkle. */
const DONUT = [
  '....KKKK....', '..KKBBBBKK..', '.KBBPPPPBBK.', '.KBPPSPPPBK.', 'KBPPPKKPPPBK', 'KBPSKKKKPPBK',
  'KBPPKKKKPSBK', 'KBPPPKKPPPBK', '.KBPPPPSPBK.', '.KBBPPPPBBK.', '..KKBBBBKK..', '....KKKK....',
];
const COLOR = { K: '#2a1a0e', B: '#c98a45', P: '#ff7eb6', S: '#56dccb' };
export function donut(cls = 'donut') {
  const rects = [];
  DONUT.forEach((row, y) => [...row].forEach((c, x) => { if (COLOR[c]) rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${COLOR[c]}"/>`); }));
  return `<svg class="${cls}" viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${rects.join('')}</svg>`;
}
