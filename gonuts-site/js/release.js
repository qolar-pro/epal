import { cachedFetch } from './lib/cache.js';
import { describeBuild, minecraftVersion, pickJar } from './lib/format.js';

const when = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

/** Shows the freshest build next to the download button, and points every download link at it. The static links work without this. */
export async function showLatestBuild(repo) {
  try {
    const release = await cachedFetch(`gonuts:release:${repo}`, `https://api.github.com/repos/${repo}/releases/latest`, (r) => r.json(), {
      init: { headers: { Accept: 'application/vnd.github+json' } },
    });
    const jar = pickJar(release.assets);
    if (!jar) return;
    document.getElementById('build').textContent = describeBuild(jar, (d) => when.format(d));
    document.querySelectorAll('a[data-download]').forEach((a) => { a.href = jar.browser_download_url; });
    const mc = minecraftVersion(jar.name);
    const primary = document.querySelector('.actions a[data-download]');
    if (mc && primary) primary.textContent = `Download for Minecraft ${mc}`;
  } catch { /* offline or rate limited: the button still works */ }
}
