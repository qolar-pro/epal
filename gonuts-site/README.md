# GoNuts site (recreation)

A rebuild of the GoNuts project page (https://cody-raves.github.io/Gonuts/, source https://github.com/cody-raves/Gonuts) with the same design, copy and behaviour,
organised as a small maintainable codebase. Static, no framework, no runtime dependencies.

## What is different from the original
- **Content is data:** all copy, steps and links live in `content/site.json`; `node scripts/build.js` generates `index.html`.
  Point `repo` and `jar` at another project and the page, the download links, the changelog and the release info follow.
- **Self-hosted fonts** (latin subsets of Pixelify Sans, Rubik, JetBrains Mono; SIL OFL) instead of Google Fonts.
- **No inline CSS or JS**, so `vercel.json` can ship a strict Content-Security-Policy (only GitHub's API and raw host are allowed for fetches).
- **ES modules** in `js/`: pure logic in `js/lib/` (changelog parser, formatters, step lookup, cache) with unit tests; DOM code in small files.
- **sessionStorage cache** (10 min, guarded) so reloads do not burn GitHub's unauthenticated API quota.
- **Download links follow the latest release** (file name, Minecraft version), with the static links as fallback.
- **Fixed:** the "Show older builds" button stayed visible after expanding (a `.button` style overrode the `hidden` attribute).
- Accessibility: skip link, `aria-current="step"` on the playing step, labelled sections, captions on both videos.

## Commands
`node scripts/build.js` build · `node tests/run.js` tests (18 checks) · `node scripts/serve.js` local server with the production headers.

## Credits and licence
The design, copy, artwork, videos and captions are the work of the GoNuts project (cody-raves/Gonuts, MIT licence), copied here for this recreation. GoNuts is not affiliated with DonutSMP.
The page itself warns that live trading on DonutSMP risks a ban; that notice is kept on purpose. If you publish this as your own site, check that you have the right to use the artwork and videos.
