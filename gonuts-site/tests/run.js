/* Unit tests for the pure modules plus structural checks on the generated page. Usage: node tests/run.js */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseChangelog, splitKind } from '../js/lib/changelog.js';
import { clock, pickJar, minecraftVersion, describeBuild, MB } from '../js/lib/format.js';
import { currentStep } from '../js/lib/steps.js';
import { readCache, writeCache } from '../js/lib/cache.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let n = 0;
const t = (name, fn) => { try { fn(); n += 1; } catch (e) { console.error('FAIL', name, '\n', e.message); process.exitCode = 1; } };

/* ---------- changelog parser ---------- */
const SAMPLE = `# GoNuts changelog

Intro text that is not an entry.

## 2026-10-13 21:30 UTC
- Fixed: after /leave took the bot out, it stayed paused. The step that follows waited
  for a balance to show on the sidebar before believing it.
- Plain line with **bold** and \`code\`.

## 2026-10-13 23:39 UTC
- Fixed: amounts of a billion or more were written in millions.

## Not a date heading
- This belongs to no entry.

## 2026-13-45 99:99 UTC
- Impossible date, dropped.

## 2026-10-12 08:05
- New: a line without the UTC suffix.

## 2026-10-11 10:00 UTC
Just prose, no bullets, so the entry is dropped.
`;
t('parse: newest first, junk dropped', () => {
  const e = parseChangelog(SAMPLE);
  assert.equal(e.length, 3);
  assert.deepEqual(e.map((x) => x.at.toISOString()), ['2026-10-13T23:39:00.000Z', '2026-10-13T21:30:00.000Z', '2026-10-12T08:05:00.000Z']);
});
t('parse: wrapped bullet is joined', () => {
  const e = parseChangelog(SAMPLE).find((x) => x.at.toISOString().startsWith('2026-10-13T21:30'));
  assert.equal(e.lines.length, 2);
  assert.match(e.lines[0], /stayed paused\. The step that follows waited for a balance/);
});
t('parse: empty and garbage input', () => { assert.deepEqual(parseChangelog(''), []); assert.deepEqual(parseChangelog('no headings here'), []); assert.deepEqual(parseChangelog(undefined), []); });
t('parse: CRLF line endings', () => { assert.equal(parseChangelog(SAMPLE.replace(/\n/g, '\r\n')).length, 3); });
t('splitKind', () => {
  assert.deepEqual(splitKind('Fixed: the **bug**'), { kind: 'Fixed', text: 'the bug' });
  assert.deepEqual(splitKind('New: `Settings` page'), { kind: 'New', text: 'Settings page' });
  assert.deepEqual(splitKind('Plain text'), { kind: null, text: 'Plain text' });
  assert.deepEqual(splitKind('Notes: not a tag'), { kind: null, text: 'Notes: not a tag' });
});

/* ---------- format helpers ---------- */
t('clock', () => { assert.equal(clock(0), '0:00'); assert.equal(clock(5), '0:05'); assert.equal(clock(69), '1:09'); assert.equal(clock(90), '1:30'); assert.equal(clock(-3), '0:00'); });
t('pickJar', () => {
  const assets = [{ name: 'GoNuts-0.1.0-mc26.2-sources.zip' }, { name: 'GoNuts-0.1.0-mc26.2.jar' }];
  assert.equal(pickJar(assets).name, 'GoNuts-0.1.0-mc26.2.jar');
  assert.equal(pickJar([{ name: 'other.jar' }]), null);
  assert.equal(pickJar(), null);
});
t('minecraftVersion', () => { assert.equal(minecraftVersion('GoNuts-0.1.0-mc26.2.jar'), '26.2'); assert.equal(minecraftVersion('GoNuts-1.0-mc1.21.4.jar'), '1.21.4'); assert.equal(minecraftVersion('GoNuts.jar'), null); });
t('describeBuild', () => { assert.equal(describeBuild({ updated_at: '2026-10-13T23:39:00Z', size: Math.round(1.34 * MB) }, () => 'Oct 14'), 'Latest build: Oct 14, 1.3 MB'); });

/* ---------- steps ---------- */
t('currentStep', () => {
  const starts = [5, 14, 22];
  assert.equal(currentStep(starts, 0), -1); assert.equal(currentStep(starts, 5), 0); assert.equal(currentStep(starts, 13.9), 0); assert.equal(currentStep(starts, 14), 1); assert.equal(currentStep(starts, 999), 2);
});

/* ---------- cache (fake storage) ---------- */
t('cache ttl and blocked storage', () => {
  const store = new Map(); const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
  assert.equal(readCache('k', 1000, 0, storage), null);
  writeCache('k', { a: 1 }, 100, storage);
  assert.deepEqual(readCache('k', 1000, 600, storage), { a: 1 });
  assert.equal(readCache('k', 1000, 1200, storage), null, 'expired');
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.equal(readCache('k', 1000, 0, blocked), null); writeCache('k', 1, 0, blocked);
});

/* ---------- generated page ---------- */
execFileSync('node', [join(root, 'scripts/build.js')], { stdio: 'pipe' });
const html = readFileSync(join(root, 'index.html'), 'utf8');
const site = JSON.parse(readFileSync(join(root, 'content/site.json'), 'utf8'));
t('page: every local asset exists', () => {
  const refs = [...html.matchAll(/(?:src|href|poster)="([^"#:]+?\.[a-z0-9]+)"/gi)].map((m) => m[1]).filter((r) => !r.startsWith('http'));
  assert.ok(refs.length > 15);
  refs.forEach((r) => assert.ok(existsSync(join(root, r)), 'missing ' + r));
});
t('page: unique ids and valid in-page links', () => {
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, 'duplicate ids');
  [...html.matchAll(/href="#([^"]+)"/g)].forEach((m) => assert.ok(ids.includes(m[1]), 'dangling #' + m[1]));
  [...html.matchAll(/aria-labelledby="([^"]+)"/g)].forEach((m) => assert.ok(ids.includes(m[1]), 'dangling aria ' + m[1]));
});
t('page: step times ascend and match the buttons', () => {
  for (const sec of [site.install, site.discord]) {
    const at = sec.steps.map((s) => s.at); assert.deepEqual(at, [...at].sort((a, b) => a - b)); assert.equal(sec.steps.length, 6);
  }
  assert.equal((html.match(/data-at="/g) || []).length, 12);
});
t('page: no inline script or style (strict CSP)', () => {
  assert.ok(!/<style[\s>]/i.test(html)); assert.ok(!/\sstyle="/i.test(html)); assert.ok(!/<script(?![^>]*\ssrc=)/i.test(html)); assert.ok(!/\son[a-z]+="/i.test(html));
});
t('css: the hidden attribute always wins', () => { assert.match(readFileSync(join(root, 'css/style.css'), 'utf8'), /\[hidden\]\s*\{\s*display:\s*none\s*!important/); });
t('page: copy is escaped', () => { assert.ok(html.includes("DonutSMP's rules") || html.includes('DonutSMP&#39;s rules')); assert.ok(!/<h1>[^<]*<[^/]/.test(html)); });
t('page: download links point at the release', () => { assert.equal((html.match(/data-download/g) || []).length, 2); assert.ok(html.includes(`https://github.com/${site.repo}/releases/latest/download/${site.jar.file}`)); });
t('page: images have alt and size', () => { for (const m of html.matchAll(/<img\b[^>]*>/g)) { assert.match(m[0], /\balt="/); assert.match(m[0], /\bwidth="\d+"/); assert.match(m[0], /\bheight="\d+"/); } });

console.log(process.exitCode ? 'FAILED' : `all ${n} checks passed`);
