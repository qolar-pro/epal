import { currentStep } from './lib/steps.js';

/** Wires one video to the list of step buttons beside it: click a step to jump, and the playing step is marked. */
export function wireVideo(filmId, stepsId) {
  const film = document.getElementById(filmId);
  const buttons = [...document.querySelectorAll(`#${stepsId} button[data-at]`)];
  if (!film || !buttons.length) return;
  const starts = buttons.map((b) => Number(b.dataset.at));

  const mark = (seconds) => {
    const now = currentStep(starts, seconds);
    buttons.forEach((b, i) => (i === now ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')));
  };

  buttons.forEach((button, i) => {
    button.addEventListener('click', () => {
      film.currentTime = starts[i];
      mark(starts[i]);
      film.play()?.catch(() => { /* the browser wants a click on the video itself */ });
      if (matchMedia('(max-width: 860px)').matches) film.scrollIntoView({ block: 'center' });
    });
  });
  film.addEventListener('timeupdate', () => mark(film.currentTime));
  // One at a time: starting one stops the other.
  film.addEventListener('play', () => {
    document.querySelectorAll('video').forEach((other) => { if (other !== film) other.pause(); });
  });
}

/** The big play button over a video poster: starts the video, hides while it plays, comes back when it ends. */
export function wirePlayButtons() {
  document.querySelectorAll('.play[data-for]').forEach((button) => {
    const film = document.getElementById(button.dataset.for);
    if (!film) return;
    button.addEventListener('click', () => { film.play()?.catch(() => { /* needs a click on the video itself */ }); film.focus(); });
    film.addEventListener('play', () => { button.hidden = true; });
    film.addEventListener('ended', () => { button.hidden = false; });
  });
}
