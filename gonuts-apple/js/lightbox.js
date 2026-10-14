/** Click a screenshot to see it large, in a native <dialog> (Esc, the close button or a click outside closes it). */
export function wireLightbox() {
  const dialog = document.getElementById('lightbox');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const img = dialog.querySelector('img');
  document.querySelectorAll('.zoom').forEach((z) => z.addEventListener('click', () => { img.src = z.dataset.full; img.alt = z.dataset.alt; dialog.showModal(); }));
  dialog.querySelector('.x').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
}
