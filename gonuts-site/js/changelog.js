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
    if (kind) {
      const tag = document.createElement('span');
      tag.className = 'kind';
      tag.textContent = `${kind}: `;
      item.append(tag, text);
    } else {
      item.textContent = text;
    }
    list.append(item);
  }
  box.append(time, list);
  return box;
}

/** Renders "What's new" from the repo's CHANGELOG.md: the first few builds, then a button for the rest. */
export async function showChangelog(repo, firstCount) {
  const log = document.getElementById('log');
  const more = document.getElementById('more');
  const draw = (entries, all) => {
    log.replaceChildren(...entries.slice(0, all ? entries.length : firstCount).map(entryNode));
    more.hidden = all || entries.length <= firstCount;
  };
  try {
    const text = await cachedFetch(`gonuts:changelog:${repo}`, `https://raw.githubusercontent.com/${repo}/main/CHANGELOG.md`, (r) => r.text());
    const entries = parseChangelog(text);
    if (!entries.length) throw new Error('no entries');
    draw(entries, false);
    more.addEventListener('click', () => draw(entries, true));
  } catch {
    const box = document.createElement('div');
    box.className = 'entry';
    const time = document.createElement('time');
    time.textContent = 'Not loaded';
    const list = document.createElement('ul');
    const item = document.createElement('li');
    item.textContent = log.dataset.failed;
    list.append(item);
    box.append(time, list);
    log.replaceChildren(box);
  }
}
