import { cachedFetch } from './lib/cache.js';
import { parseChangelog, splitKind } from './lib/changelog.js';

const when = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

function entryNode({ at, lines }) {
  const box = document.createElement('div');
  box.className = 'entry';
  const time = document.createElement('time');
  time.dateTime = at.toISOString();
  time.textContent = when.format(at);
  const list = document.createElement('ul');
  for (const line of lines) {
    const item = document.createElement('li');
    const { kind, text } = splitKind(line);
    if (kind) { const tag = document.createElement('span'); tag.className = 'kind'; tag.textContent = `${kind}: `; item.append(tag, text); } else item.textContent = text;
    list.append(item);
  }
  box.append(time, list);
  return box;
}

/** Renders the repo's CHANGELOG.md into #log: the first `count` builds on the home page, all of them on /changelog. */
export async function showChangelog(repo, count) {
  const log = document.getElementById('log');
  if (!log) return;
  try {
    const text = await cachedFetch(`gonuts:changelog:${repo}`, `https://raw.githubusercontent.com/${repo}/main/CHANGELOG.md`, (r) => r.text());
    const entries = parseChangelog(text);
    if (!entries.length) throw new Error('no entries');
    log.replaceChildren(...(log.dataset.all ? entries : entries.slice(0, count)).map(entryNode));
  } catch {
    const box = document.createElement('div');
    box.className = 'entry';
    const time = document.createElement('time'); time.textContent = 'Not loaded';
    const list = document.createElement('ul'); const item = document.createElement('li'); item.textContent = log.dataset.failed; list.append(item);
    box.append(time, list);
    log.replaceChildren(box);
  }
}
