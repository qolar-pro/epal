/** "Meet the bot": the buttons swap the mascot, its caption and its description. Static HTML shows the first mood without JS. */
export function wireMoods() {
  const img = document.getElementById('mood-img'), cap = document.getElementById('mood-cap'), text = document.getElementById('mood-text');
  const buttons = [...document.querySelectorAll('.picker button')];
  if (!img || !buttons.length) return;
  buttons.forEach((b) => b.addEventListener('click', () => {
    buttons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    img.src = b.dataset.img; img.alt = b.dataset.alt; cap.textContent = b.dataset.caption; text.textContent = b.dataset.text;
  }));
}
