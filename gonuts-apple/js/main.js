import { wireVideo } from './video-steps.js';
import { showLatestBuild } from './release.js';
import { showChangelog } from './changelog.js';
import { reveal, litWords, tilt } from './motion.js';
import { wireMoods } from './moods.js';

const config = document.querySelector('script[type="module"][data-repo]').dataset;
reveal(); litWords(); tilt(); wireMoods();
wireVideo('film', 'steps');
wireVideo('film-discord', 'steps-discord');
showLatestBuild(config.repo);
showChangelog(config.repo, Number(config.first) || 3);
