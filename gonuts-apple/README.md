# GoNuts, product-page edition

The GoNuts project page (content and artwork from https://github.com/cody-raves/Gonuts, MIT) redesigned as a product page:
huge centred type, a blurred translucent nav, alternating black/dark sections, rounded bento tiles, scroll-lit statement text, a hero window that
leans toward the pointer, a "meet the bot" mood picker, a spec table and a scroll-revealed layout, all in the mod's own palette. Visual polish pass: animated aurora hero with pixel-donut parallax, marquee, a scroll-driven "how it works" story with a sticky panel, pointer-spotlight tiles, 3D keycaps, click-to-enlarge screenshots, video play overlay, FAQ, scrollspy nav with a mobile menu and a scroll progress bar.
(`../gonuts-site` is the faithful clone of the original design; this is the redesign.)

## Code
- `content/site.json` holds all copy; `node scripts/build.js` (`npm run generate`) writes `index.html`, `changelog.html`, `404.html`.
- `js/lib/*` is pure and unit-tested (changelog parser, formatters, step lookup, cache, motion maths); `js/*.js` is the DOM glue (reveal, lit words, tilt, moods, video steps, release info, changelog).
- Self-hosted fonts, no inline CSS or JS, strict CSP in `vercel.json` (only GitHub's API and raw host may be fetched), cached API calls, reduced-motion respected.
- Live data: download links, build date and file size come from the latest GitHub release; the changelog comes from CHANGELOG.md (3 builds on the home page, all on `/changelog`).
- `node tests/run.js` (38 checks) · `node scripts/serve.js` serves locally with the production headers.

## Credits
Artwork, videos, captions and copy are the GoNuts project's (cody-raves/Gonuts, MIT). GoNuts is not affiliated with DonutSMP; the live-trading ban-risk notice is kept on purpose.
