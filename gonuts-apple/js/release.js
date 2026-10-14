import { cachedFetch } from './lib/cache.js';
import { describeBuild, minecraftVersion, pickJar, MB } from './lib/format.js';

const when = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

/** Shows the freshest build next to the download button, and points every download link at it. The static links work without this. */
export async function showLatestBuild(repo) {
  try {
    const release = await cachedFetch(`gonuts:release:${repo}`, `https://api.github.com/repos/${repo}/releases/latest`, (r) => r.json(), {
      init: { headers: { Accept: 'application/vnd.github+json' } },
    });
    const jar = pickJar(release.assets);
    if (!jar) return;
    const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
    set('build', describeBuild(jar, (d) => when.format(d)));
    set('spec-build', `${when.format(new Date(jar.updated_at))} (${jar.name})`);
    set('spec-size', `${(jar.size / MB).toFixed(1)} MB`);
    document.querySelectorAll('a[data-download]').forEach((a) => { a.href = jar.browser_download_url; });
    const mc = minecraftVersion(jar.name);
    const cta = document.querySelector('#download a[data-download]');
    if (mc && cta) cta.textContent = `Download for Minecraft ${mc}`;
  } catch { /* offline or rate limited: the button still works */ }
}
