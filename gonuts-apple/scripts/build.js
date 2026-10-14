/* Generates index.html, changelog.html and 404.html from content/site.json. Usage: node scripts/build.js */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { clock } from '../js/lib/format.js';
import { icon, donut } from './icons.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const S = JSON.parse(readFileSync(join(root, 'content/site.json'), 'utf8'));
const gh = `https://github.com/${S.repo}`;
const jarUrl = `${gh}/releases/latest/download/${S.jar.file}`;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/** `code` spans become <span class="mono">; everything else is escaped. */
const rich = (s) => esc(s).replace(/`([^`]+)`/g, '<span class="mono">$1</span>');

/* ---------- shared chrome ---------- */
function page({ file, title, description, path, body, bodyClass = '', scripts = true }) {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${S.site}${path}">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${S.site}${path}"><meta property="og:image" content="${S.site}/assets/logo.png">
<meta name="theme-color" content="#000000">
<link rel="icon" href="/assets/mascot-idle.gif">
<link rel="preload" href="/assets/fonts/pixelify-sans-700.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/rubik-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/css/fonts.css">
<link rel="stylesheet" href="/css/style.css">
${scripts ? `<script type="module" src="/js/main.js" data-repo="${S.repo}" data-first="${S.news.firstCount}"></script>` : ''}
</head>
<body class="${bodyClass}">
<a class="skip" href="#main">Skip to content</a>
<div class="progress" aria-hidden="true"><i></i></div>
<nav class="gnav" aria-label="Main"><div class="gnav-in">
  <a class="gnav-brand" href="/" aria-label="${esc(S.brand)}, home"><img src="/assets/logo.png" alt="${esc(S.brand)}" width="512" height="185"></a>
  <ul class="gnav-links" id="menu">
    <li><a href="/#features">Features</a></li><li><a href="/#how">How it works</a></li><li><a href="/#install">Install</a></li><li><a href="/#discord">Discord</a></li><li><a href="/#new">What's new</a></li><li><a href="${gh}">GitHub</a></li>
  </ul>
  <a class="gnav-buy" href="${jarUrl}" data-download>Download</a>
  <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu" aria-label="Menu">${icon('menu', 'ic open')}${icon('close', 'ic shut')}</button>
</div></nav>
<main id="main">
${body}
</main>
<footer class="site-foot">
  <div class="foot-in">
    <div class="foot-cols">
      <div><img class="foot-logo" src="/assets/logo.png" alt="${esc(S.brand)}" width="512" height="185"><p>Trade the DonutSMP auction house on autopilot. Free, open source, off until you turn it on.</p></div>
      <div><h4>Project</h4><ul><li><a href="${gh}">Source on GitHub</a></li><li><a href="${gh}/releases/latest">Releases</a></li><li><a href="${gh}/issues">Report a problem</a></li><li><a href="/changelog">Changelog</a></li></ul></div>
      <div><h4>Guides</h4><ul><li><a href="${gh}/blob/main/docs/getting-started.md">Getting started</a></li><li><a href="${gh}/blob/main/docs/discord.md">Discord setup</a></li><li><a href="/#faq">Questions</a></li></ul></div>
    </div>
    <ol class="fn">
      <li>${esc(S.risk.paragraphs[0])}</li>
      <li>GoNuts is an independent project, free and open source under the MIT licence. It is not affiliated with or endorsed by DonutSMP or Mojang.</li>
    </ol>
  </div>
</footer>
</body>
</html>
`;
  writeFileSync(join(root, file), html);
}

/* ---------- section builders ---------- */
const videoSection = (sec, tone) => {
  const v = sec.video;
  return `
<section class="${tone}" id="${sec.id}" aria-labelledby="h-${sec.id}">
  <div class="inner">
    <h2 id="h-${sec.id}" class="big rv">${esc(sec.title)}</h2>
    <p class="sub rv">${esc(sec.sub)}</p>
    <div class="video-grid">
      <div class="player rv">
        <div class="frame">
          <video id="${v.id}" controls preload="metadata" poster="/${v.poster}">
            <source src="/${v.src}" type="video/mp4">
            <track kind="captions" src="/${v.captions}" srclang="en" label="English" default>
            Your browser cannot play this video. <a href="/${v.src}">Download it</a> instead.
          </video>
          <button class="play" type="button" data-for="${v.id}" aria-label="Play video: ${esc(v.caption)}">${icon('play', 'ic')}</button>
        </div>
        <div class="under"><span>${esc(v.caption)}</span><a href="${gh}/blob/main/${v.guide}">Prefer to read? The written guide ›</a></div>
      </div>
      <div class="rv">
        <ol class="steps" id="${v.stepsId}">
${sec.steps.map((s, i) => `          <li><button type="button" data-at="${s.at}"><span class="n">${i + 1}</span><span class="txt"><span class="what">${esc(s.what)}</span><span class="how">${rich(s.how)}</span></span><span class="at">${clock(s.at)}</span></button></li>`).join('\n')}
        </ol>
        <p class="fine">${esc(sec.after)}</p>
      </div>
    </div>
  </div>
</section>`;
};

const tile = (t) => t.kind === 'stat'
  ? `      <article class="tile stat rv"><p class="figure">${esc(t.stat)}<small>${esc(t.unit)}</small></p><h3>${esc(t.h)}</h3><p>${esc(t.p)}</p></article>`
  : `      <article class="tile ${t.kind.replace('tile', '').trim()} rv">${t.icon ? `<span class="chip">${icon(t.icon)}</span>` : ''}<p class="k">${esc(t.k)}</p><h3>${esc(t.h)}</h3><p>${esc(t.p)}</p></article>`;

const m0 = S.moods.items[0];
const moodById = Object.fromEntries(S.moods.items.map((m) => [m.id, m]));
const home = `
<section class="hero s-black" id="top">
  <div class="aurora" aria-hidden="true"><i></i><i></i><i></i></div>
  <div class="gridfx" aria-hidden="true"></div>
  <div class="sprites" aria-hidden="true"><span class="sp s1" data-depth="0.35">${donut()}</span><span class="sp s2" data-depth="0.6">${donut()}</span><span class="sp s3" data-depth="0.2">${donut()}</span></div>
  <p class="eyebrow in-1">${esc(S.hero.eyebrow)}</p>
  <h1 class="in-2">${esc(S.hero.title)}</h1>
  <p class="sub in-3">${esc(S.hero.sub)}</p>
  <p class="links in-4"><a class="btn" href="${jarUrl}" data-download>${icon('download')}<span>${esc(S.hero.primary)}</span></a><a class="lnk" href="#install">${esc(S.hero.secondary)}</a></p>
  <p class="build in-4" id="build" aria-live="polite"></p>
  <div class="stage in-5" id="stage">
    <figure class="device" id="device">
      <div class="chrome" aria-hidden="true"><i></i><i></i><i></i><span>${esc(S.hero.windowTitle)}</span></div>
      <img src="/${S.hero.shot.img}" alt="${esc(S.hero.shot.alt)}" width="1600" height="900" fetchpriority="high">
      <div class="glare" aria-hidden="true"></div>
    </figure>
    <img class="float f1" src="/assets/mascot-sale.gif" alt="" width="110" height="110">
    <img class="float f2" src="/assets/mascot-working.gif" alt="" width="110" height="110">
  </div>
</section>

<div class="marquee s-black" aria-hidden="true"><div class="track">${[0, 1].map(() => `<ul>${S.marquee.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>`).join('')}</div></div>

<section class="statement s-night" aria-labelledby="h-stmt"><h2 id="h-stmt" class="sr">The idea</h2><p class="words" id="words">${esc(S.statement)}</p></section>

<section class="s-black how" id="how" aria-labelledby="h-how">
  <div class="inner">
    <h2 id="h-how" class="big rv">${esc(S.how.title)}</h2><p class="sub rv">${esc(S.how.sub)}</p>
    <div class="how-grid">
      <div class="how-steps">
${S.how.steps.map((st, i) => `        <article class="how-step" data-img="/${moodById[st.mood].img}" data-alt="${esc(moodById[st.mood].alt)}" data-cap="${esc(moodById[st.mood].caption)}"><span class="num">${String(i + 1).padStart(2, '0')}</span><span class="chip">${icon(st.icon)}</span><h3>${esc(st.h)}</h3><p>${esc(st.p)}</p></article>`).join('\n')}
      </div>
      <div class="how-panel" aria-hidden="true"><div class="panel-in"><img id="how-img" src="/${moodById[S.how.steps[0].mood].img}" alt="" width="200" height="200"><p id="how-cap">${esc(moodById[S.how.steps[0].mood].caption)}</p><ol class="dots">${S.how.steps.map((_, i) => `<li${i === 0 ? ' class="on"' : ''}></li>`).join('')}</ol></div></div>
    </div>
  </div>
</section>

<section class="s-panel" id="features" aria-labelledby="h-features">
  <div class="inner"><h2 id="h-features" class="big rv">${esc(S.bento.title)}</h2>
    <div class="bento">
${S.bento.tiles.map(tile).join('\n')}
    </div>
  </div>
</section>

<section class="s-black guard" id="guard" aria-labelledby="h-guard">
  <div class="inner center">
    <h2 id="h-guard" class="big rv">${esc(S.guard.title)}</h2><p class="sub rv">${esc(S.guard.sub)}</p>
    <div class="keys">
${S.guard.keys.map((k) => `      <div class="keycard rv"><div class="key" aria-hidden="true"><span>${esc(k.cap)}</span></div><h3><span class="sr">The ${esc(k.cap)} key: </span>${esc(k.h)}</h3><p>${esc(k.p)}</p></div>`).join('\n')}
    </div>
    <ul class="chips rv">${S.guard.chips.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
  </div>
</section>

<section class="s-night" id="moods" aria-labelledby="h-moods">
  <div class="inner center">
    <h2 id="h-moods" class="big rv">${esc(S.moods.title)}</h2>
    <p class="sub rv">${esc(S.moods.sub)}</p>
    <div class="mood-stage rv">
      <img id="mood-img" src="/${m0.img}" alt="${esc(m0.alt)}" width="200" height="200">
      <p class="mood-cap" id="mood-cap">${esc(m0.caption)}</p>
      <p class="mood-text" id="mood-text">${esc(m0.text)}</p>
    </div>
    <div class="picker" role="group" aria-label="Bot mood">
${S.moods.items.map((m, i) => `      <button type="button" data-img="/${m.img}" data-alt="${esc(m.alt)}" data-caption="${esc(m.caption)}" data-text="${esc(m.text)}" aria-pressed="${i === 0}">${esc(m.label)}</button>`).join('\n')}
    </div>
  </div>
</section>
${videoSection(S.install, 's-black')}
${videoSection(S.discord, 's-night')}

<section class="s-panel" id="screens" aria-labelledby="h-screens">
  <div class="inner center"><h2 id="h-screens" class="big rv">${esc(S.screens.title)}</h2><p class="sub rv">${esc(S.screens.sub)}</p>
    <div class="shots">
${S.screens.shots.map((s) => `      <figure class="shot rv"><button type="button" class="zoom" data-full="/${s.img}" data-alt="${esc(s.alt)}" aria-label="Enlarge: ${esc(s.caption)}"><img src="/${s.img}" alt="${esc(s.alt)}" width="1600" height="900" loading="lazy"></button><figcaption>${esc(s.caption)}</figcaption></figure>`).join('\n')}
    </div>
  </div>
</section>
<dialog id="lightbox" aria-label="Screenshot"><button type="button" class="x" aria-label="Close">${icon('close')}</button><img alt="" width="1600" height="900"></dialog>

<section class="s-black" id="specs" aria-labelledby="h-specs">
  <div class="inner"><h2 id="h-specs" class="big rv">${esc(S.specs.title)}</h2>
    <table class="specs rv"><caption class="sr">GoNuts technical specifications</caption><tbody>
${S.specs.rows.map(([k, v]) => `      <tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('\n')}
      <tr><th scope="row">Latest build</th><td id="spec-build">See the releases page</td></tr>
      <tr><th scope="row">File size</th><td id="spec-size">-</td></tr>
    </tbody></table>
  </div>
</section>

<section class="s-night" id="new" aria-labelledby="h-new">
  <div class="inner"><h2 id="h-new" class="big rv">${esc(S.news.title)}</h2><p class="sub rv">${esc(S.news.sub)}</p>
    <div class="log" id="log" aria-live="polite" data-failed="${esc(S.news.failed)}"><div class="entry"><time>Loading</time><ul><li>${esc(S.news.loading)}</li></ul></div></div>
    <p class="links"><a class="lnk" href="/changelog">All builds</a><a class="lnk" href="${gh}/blob/main/CHANGELOG.md">The changelog on GitHub</a></p>
  </div>
</section>

<section class="s-panel" id="faq" aria-labelledby="h-faq">
  <div class="inner"><h2 id="h-faq" class="big rv">${esc(S.faq.title)}</h2>
    <div class="faq rv">
${S.faq.items.map(([q, a]) => `      <details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n')}
    </div>
  </div>
</section>

<section class="s-black" id="risk" aria-labelledby="h-risk">
  <div class="inner"><div class="risk rv"><h2 id="h-risk">${esc(S.risk.title)}</h2>
${S.risk.paragraphs.map((p) => `    <p>${esc(p)}</p>`).join('\n')}
  </div></div>
</section>

<section class="cta s-night" id="download" aria-labelledby="h-cta">
  <div class="aurora soft" aria-hidden="true"><i></i><i></i></div>
  <div class="sprites" aria-hidden="true"><span class="sp s4" data-depth="0.3">${donut()}</span><span class="sp s5" data-depth="0.5">${donut()}</span></div>
  <h2 id="h-cta" class="big rv">${esc(S.cta.title)}</h2><p class="sub rv">${esc(S.cta.sub)}</p>
  <p class="links rv"><a class="btn" href="${jarUrl}" data-download>${icon('download')}<span>Download for Minecraft ${esc(S.jar.minecraft)}</span></a><a class="lnk" href="${gh}">View the source</a></p>
</section>`;

page({ file: 'index.html', title: S.meta.title, description: S.meta.description, path: '/', body: home });
page({
  file: 'changelog.html', title: `Changelog · ${S.brand}`, description: 'What each GoNuts build changed, newest first.', path: '/changelog',
  body: `<header class="page-h s-black"><p class="eyebrow">${esc(S.brand)}</p><h1>Changelog.</h1><p class="sub">What each build changed, newest first. Times are in your local time.</p></header>
<section class="s-night"><div class="inner"><div class="log" id="log" aria-live="polite" data-failed="${esc(S.news.failed)}" data-all="true"><div class="entry"><time>Loading</time><ul><li>${esc(S.news.loading)}</li></ul></div></div><p class="links"><a class="lnk" href="${gh}/blob/main/CHANGELOG.md">The changelog on GitHub</a></p></div></section>`,
});
page({ file: '404.html', title: `Page not found · ${S.brand}`, description: 'Page not found.', path: '/404', scripts: false, body: `<header class="page-h s-black"><h1>Page not found.</h1><p class="links"><a class="lnk" href="/">Go to the home page</a></p></header>` });
console.log('built index.html, changelog.html, 404.html');
