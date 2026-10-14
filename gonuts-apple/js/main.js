import { wireVideo, wirePlayButtons } from './video-steps.js';
import { showLatestBuild } from './release.js';
import { showChangelog } from './changelog.js';
import { reveal, litWords, tilt, spotlight, parallaxSprites } from './motion.js';
import { wireMoods } from './moods.js';
import { wireNav } from './nav.js';
import { wireHow } from './how.js';
import { wireLightbox } from './lightbox.js';

const config = document.querySelector('script[type="module"][data-repo]').dataset;
reveal(); litWords(); tilt(); spotlight(); parallaxSprites(); wireNav(); wireHow(); wireMoods(); wireLightbox();
wireVideo('film', 'steps');
wireVideo('film-discord', 'steps-discord');
wirePlayButtons();
showLatestBuild(config.repo);
showChangelog(config.repo, Number(config.first) || 3);
