import { wireVideo } from './video-steps.js';
import { showLatestBuild } from './release.js';
import { showChangelog } from './changelog.js';

const config = document.querySelector('script[type="module"][data-repo]').dataset;
wireVideo('film', 'steps');
wireVideo('film-discord', 'steps-discord');
showLatestBuild(config.repo);
showChangelog(config.repo, Number(config.first) || 4);
