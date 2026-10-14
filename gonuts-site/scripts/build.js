/* Generates index.html from content/site.json. Usage: node scripts/build.js */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = JSON.parse(readFileSync(join(root, 'content/site.json'), 'utf8'));
const gh = `https://github.com/${site.repo}`;
const jarUrl = `${gh}/releases/latest/download/${site.jar.file}`;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/** `code` spans in the copy become <span class="mono">. Everything else is escaped. */
const rich = (s) => esc(s).replace(/`([^`]+)`/g, '<span class="mono">$1</span>');
export const clock = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

const head = (label, title, lede) => `
    <div class="section-head">
      <div class="label">${esc(label)}</div>
      <h2>${esc(title)}</h2>${lede ? `\n      <p class="lede">${esc(lede)}</p>` : ''}
    </div>`;

function film(sec) {
  const v = sec.video;
  return `
    <div class="install-grid">
      <div class="player">
        <video id="${v.id}" controls preload="metadata" poster="${v.poster}">
          <source src="${v.src}" type="video/mp4">
          <track kind="captions" src="${v.captions}" srclang="en" label="English" default>
          Your browser cannot play this video. <a href="${v.src}">Download it</a> instead.
        </video>
        <div class="under">
          <span>${esc(v.caption)}</span>
          <a href="${gh}/blob/main/${v.guide}">Prefer to read? The written guide</a>
        </div>
      </div>
      <div>
        <ol class="steps" id="${v.stepsId}">
${sec.steps.map((s, i) => `          <li><button type="button" data-at="${s.at}"><span class="n">${i + 1}</span><span><span class="what">${esc(s.what)}</span><span class="how">${rich(s.how)}</span></span><span class="at">${clock(s.at)}</span></button></li>`).join('\n')}
        </ol>
        <p class="after">${esc(sec.after)}</p>
      </div>
    </div>`;
}
const videoSection = (sec) => `
<section id="${sec.id}" aria-labelledby="h-${sec.id}">
  <div class="wrap">${head(sec.label, sec.title, sec.lede).replace('<h2>', `<h2 id="h-${sec.id}">`)}${film(sec)}
  </div>
</section>`;

const { hero, does, screen, news, risk } = site;
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(site.meta.title)}</title>
<meta name="description" content="${esc(site.meta.description)}">
<meta property="og:title" content="${esc(site.meta.ogTitle)}">
<meta property="og:description" content="${esc(site.meta.ogDescription)}">
<meta property="og:image" content="${site.siteUrl}assets/logo.png">
<meta property="og:type" content="website">
<meta name="theme-color" content="#0c121b">
<link rel="icon" href="assets/mascot-idle.gif">
<link rel="preload" href="assets/fonts/pixelify-sans-700.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/rubik-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="css/fonts.css">
<link rel="stylesheet" href="css/style.css">
<script type="module" src="js/main.js" data-repo="${site.repo}" data-first="${news.firstCount}"></script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>

<header class="bar">
  <div class="wrap">
    <a href="#top" aria-label="${esc(site.brand)}, top of page"><img src="assets/logo.png" alt="${esc(site.brand)}" width="512" height="185"></a>
    <nav aria-label="Sections">
      <a class="optional" href="#install">Install</a>
      <a class="optional" href="#discord">Discord</a>
      <a class="optional" href="#does">What it does</a>
      <a class="optional" href="#new">What's new</a>
      <a href="${gh}">GitHub</a>
      <a class="button primary small" href="${jarUrl}" data-download>Download</a>
    </nav>
  </div>
</header>

<main id="main">
<span id="top"></span>

<section class="hero">
  <div class="wrap hero-grid">
    <div>
      <img class="hero-logo" src="assets/logo.png" alt="${esc(site.brand)}" width="512" height="185">
      <h1>${esc(hero.title)}</h1>
      <p class="lede">${esc(hero.lede)}</p>
      <div class="actions">
        <a class="button primary" href="${jarUrl}" data-download>${esc(hero.primary)}</a>
        <a class="button" href="#install">${esc(hero.secondary)}</a>
      </div>
      <p class="build" id="build" aria-live="polite"></p>
      <ul class="facts">
${hero.facts.map((f) => `        <li>${esc(f)}</li>`).join('\n')}
      </ul>
    </div>

    <div class="desk" role="group" aria-label="The ${esc(site.brand)} bot and its moods">
      <div>
        <div class="label">${esc(hero.desk.label)}</div>
        <div class="say">${esc(hero.desk.say)}</div>
        <div class="sub">${esc(hero.desk.sub)}</div>
      </div>
      <div class="faces">
${hero.desk.faces.map((f) => `        <figure><img src="${f.img}" alt="${esc(f.alt)}" width="110" height="110"><figcaption>${esc(f.caption)}</figcaption></figure>`).join('\n')}
      </div>
    </div>
  </div>
</section>
${videoSection(site.install)}
${videoSection(site.discord)}
<section id="${does.id}" aria-labelledby="h-does">
  <div class="wrap">${head(does.label, does.title).replace('<h2>', '<h2 id="h-does">')}
    <div class="cards">
${does.cards.map((c) => `      <article class="card">
        <h3>${esc(c.title)}</h3>
        <p>${esc(c.text)}</p>
      </article>`).join('\n')}
    </div>
  </div>
</section>

<section id="${screen.id}" aria-labelledby="h-screen">
  <div class="wrap">${head(screen.label, screen.title, screen.lede).replace('<h2>', '<h2 id="h-screen">')}
    <div class="shots">
${screen.shots.map((s) => `      <figure class="shot">
        <img src="${s.img}" alt="${esc(s.alt)}" width="1600" height="900" loading="lazy">
        <figcaption>${esc(s.caption)}</figcaption>
      </figure>`).join('\n')}
    </div>
  </div>
</section>

<section id="${news.id}" aria-labelledby="h-new">
  <div class="wrap">${head(news.label, news.title, news.lede).replace('<h2>', '<h2 id="h-new">')}
    <div class="log" id="log" aria-live="polite" data-failed="${esc(news.failed)}">
      <div class="entry"><time>Loading</time><ul><li>${esc(news.loading)}</li></ul></div>
    </div>
    <div class="log-foot">
      <button class="button small" id="more" type="button" hidden>Show older builds</button>
      <a href="${gh}/blob/main/CHANGELOG.md">The full changelog on GitHub</a>
    </div>
  </div>
</section>

<section id="risk" aria-labelledby="h-risk">
  <div class="wrap">
    <div class="risk">
      <h2 id="h-risk">${esc(risk.title)}</h2>
${risk.paragraphs.map((p) => `      <p>${esc(p)}</p>`).join('\n')}
    </div>
  </div>
</section>

</main>

<footer>
  <div class="wrap">
    <span>${esc(site.footer.license)}</span>
    <span><a href="${gh}">Source</a> · <a href="${gh}/releases/latest">Releases</a> · <a href="${gh}/issues">Report a problem</a></span>
  </div>
</footer>
</body>
</html>
`;
writeFileSync(join(root, 'index.html'), html);
console.log('built index.html (' + html.length + ' bytes)');
