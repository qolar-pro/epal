/* Unit tests for the pure modules plus structural checks on the generated pages. Usage: node tests/run.js */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseChangelog, splitKind } from '../js/lib/changelog.js';
import { clock, pickJar, minecraftVersion, describeBuild, MB } from '../js/lib/format.js';
import { currentStep } from '../js/lib/steps.js';
import { readCache, writeCache } from '../js/lib/cache.js';
import { litCount, scrollProgress, tiltAngles } from '../js/lib/motion.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let n = 0;
const t = (name, fn) => { try { fn(); n += 1; } catch (e) { console.error('FAIL', name, '\n', e.message); process.exitCode = 1; } };

/* ---------- changelog parser ---------- */
const SAMPLE = `# GoNuts changelog\n\nIntro text.\n\n## 2026-10-13 21:30 UTC\n- Fixed: after /leave took the bot out, it stayed paused. The step that follows waited\n  for a balance to show on the sidebar.\n- Plain line with **bold** and \`code\`.\n\n## 2026-10-13 23:39 UTC\n- Fixed: amounts of a billion or more were written in millions.\n\n## Not a date heading\n- Belongs to no entry.\n\n## 2026-13-45 99:99 UTC\n- Impossible date.\n\n## 2026-10-12 08:05\n- New: no UTC suffix.\n\n## 2026-10-11 10:00 UTC\nJust prose, no bullets.\n`;
t('parse: newest first, junk dropped', () => { const e = parseChangelog(SAMPLE); assert.equal(e.length, 3); assert.deepEqual(e.map((x) => x.at.toISOString()), ['2026-10-13T23:39:00.000Z', '2026-10-13T21:30:00.000Z', '2026-10-12T08:05:00.000Z']); });
t('parse: wrapped bullet joined', () => { const e = parseChangelog(SAMPLE).find((x) => x.at.toISOString().startsWith('2026-10-13T21:30')); assert.equal(e.lines.length, 2); assert.match(e.lines[0], /stayed paused\. The step that follows waited for a balance/); });
t('parse: empty, garbage, CRLF', () => { assert.deepEqual(parseChangelog(''), []); assert.deepEqual(parseChangelog(undefined), []); assert.equal(parseChangelog(SAMPLE.replace(/\n/g, '\r\n')).length, 3); });
t('splitKind', () => { assert.deepEqual(splitKind('Fixed: the **bug**'), { kind: 'Fixed', text: 'the bug' }); assert.deepEqual(splitKind('Plain'), { kind: null, text: 'Plain' }); assert.deepEqual(splitKind('Notes: x'), { kind: null, text: 'Notes: x' }); });

/* ---------- format / steps / cache ---------- */
t('clock', () => { assert.equal(clock(5), '0:05'); assert.equal(clock(69), '1:09'); assert.equal(clock(90), '1:30'); assert.equal(clock(-3), '0:00'); });
t('pickJar + minecraftVersion', () => { assert.equal(pickJar([{ name: 'x.zip' }, { name: 'GoNuts-0.1.0-mc26.2.jar' }]).name, 'GoNuts-0.1.0-mc26.2.jar'); assert.equal(pickJar(), null); assert.equal(minecraftVersion('GoNuts-1.0-mc1.21.4.jar'), '1.21.4'); assert.equal(minecraftVersion('a.jar'), null); });
t('describeBuild', () => { assert.equal(describeBuild({ updated_at: '2026-10-13T23:39:00Z', size: Math.round(1.34 * MB) }, () => 'Oct 14'), 'Latest build: Oct 14, 1.3 MB'); });
t('currentStep', () => { const s = [5, 14, 22]; assert.equal(currentStep(s, 0), -1); assert.equal(currentStep(s, 5), 0); assert.equal(currentStep(s, 13.9), 0); assert.equal(currentStep(s, 999), 2); });
t('cache ttl and blocked storage', () => {
  const m = new Map(); const st = { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
  assert.equal(readCache('k', 1000, 0, st), null); writeCache('k', { a: 1 }, 100, st); assert.deepEqual(readCache('k', 1000, 600, st), { a: 1 }); assert.equal(readCache('k', 1000, 1200, st), null);
  const bad = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } }; assert.equal(readCache('k', 1000, 0, bad), null); writeCache('k', 1, 0, bad);
});

/* ---------- motion maths ---------- */
t('litCount', () => { assert.equal(litCount(0, 10), 0); assert.equal(litCount(0.5, 10), 6); assert.equal(litCount(1, 10), 10); assert.equal(litCount(2, 10), 10); assert.equal(litCount(-1, 10), 0); });
t('scrollProgress', () => { assert.equal(scrollProgress(800, 400, 1000), 0); assert.ok(scrollProgress(0, 400, 1000) > 0.5); assert.ok(scrollProgress(-500, 400, 1000) >= 1); });
t('tiltAngles', () => { assert.deepEqual(tiltAngles(0.5, 0.5), { rx: 0, ry: 0 }); const a = tiltAngles(1, 0); assert.ok(a.ry > 0 && a.rx > 0); const b = tiltAngles(5, -5); assert.deepEqual(b, tiltAngles(1, 0), 'clamped'); });

/* ---------- generated pages ---------- */
execFileSync('node', [join(root, 'scripts/build.js')], { stdio: 'pipe' });
const site = JSON.parse(readFileSync(join(root, 'content/site.json'), 'utf8'));
const pages = Object.fromEntries(['index', 'changelog', '404'].map((p) => [p, readFileSync(join(root, `${p}.html`), 'utf8')]));
const idsOf = (h) => [...h.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
for (const [name, html] of Object.entries(pages)) {
  t(`${name}: local assets exist`, () => { [...html.matchAll(/(?:src|href|poster)="(\/[^"#?]+\.[a-z0-9]+)"/gi)].forEach((m) => assert.ok(existsSync(join(root, m[1])), 'missing ' + m[1])); });
  t(`${name}: unique ids, no dangling references`, () => { const ids = idsOf(html); assert.equal(new Set(ids).size, ids.length); [...html.matchAll(/href="#([^"]+)"/g)].forEach((m) => assert.ok(ids.includes(m[1]), '#' + m[1])); [...html.matchAll(/aria-labelledby="([^"]+)"/g)].forEach((m) => assert.ok(ids.includes(m[1]), 'aria ' + m[1])); });
  t(`${name}: strict-CSP clean (no inline code)`, () => { assert.ok(!/<style[\s>]/i.test(html)); assert.ok(!/\sstyle="/i.test(html)); assert.ok(!/<script(?![^>]*\ssrc=)/i.test(html)); assert.ok(!/\son[a-z]+="/i.test(html)); });
  t(`${name}: images have alt, width, height`, () => { for (const m of html.matchAll(/<img\b[^>]*>/g)) { assert.match(m[0], /\balt="/); assert.match(m[0], /\bwidth="\d+"/); assert.match(m[0], /\bheight="\d+"/); } });
  t(`${name}: has skip link, one h1, canonical`, () => { assert.match(html, /class="skip" href="#main"/); assert.equal((html.match(/<h1[\s>]/g) || []).length, 1); assert.match(html, /<link rel="canonical"/); });
}
t('index: steps ascend, 12 step buttons, moods wired', () => {
  for (const sec of [site.install, site.discord]) { const at = sec.steps.map((s) => s.at); assert.deepEqual(at, [...at].sort((a, b) => a - b)); }
  assert.equal((pages.index.match(/data-at="/g) || []).length, 12);
  assert.equal((pages.index.match(/data-caption="/g) || []).length, site.moods.items.length);
  assert.equal((pages.index.match(/aria-pressed="true"/g) || []).length, 1);
});
t('index: bento has every tile, download links point at the release', () => {
  assert.equal((pages.index.match(/class="tile /g) || []).length, site.bento.tiles.length);
  assert.ok(pages.index.includes(`https://github.com/${site.repo}/releases/latest/download/${site.jar.file}`)); assert.ok((pages.index.match(/data-download/g) || []).length >= 3);
});
t('changelog page lists all builds', () => { assert.match(pages.changelog, /data-all="true"/); });
t('css: hidden attribute always wins', () => { assert.match(readFileSync(join(root, 'css/style.css'), 'utf8'), /\[hidden\]\s*\{\s*display:\s*none\s*!important/); });
t('css: reduced-motion media query present', () => { assert.match(readFileSync(join(root, 'css/style.css'), 'utf8'), /prefers-reduced-motion:\s*reduce/); });
console.log(process.exitCode ? 'FAILED' : `all ${n} checks passed`);
