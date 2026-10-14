/* A tiny sessionStorage cache, so reloading does not burn the unauthenticated GitHub API quota (60 requests/hour).
   Every storage access is guarded: the page must work when storage is blocked. */

export function readCache(key, ttlMs, now = Date.now(), storage = globalThis.sessionStorage) {
  try {
    const raw = JSON.parse(storage.getItem(key));
    return raw && now - raw.t < ttlMs ? raw.v : null;
  } catch { return null; }
}

export function writeCache(key, value, now = Date.now(), storage = globalThis.sessionStorage) {
  try { storage.setItem(key, JSON.stringify({ t: now, v: value })); } catch { /* blocked or full: no cache */ }
}

/** Fetch with a cache in front. `parse` turns the Response into the value to cache. */
export async function cachedFetch(key, url, parse, { ttlMs = 10 * 60 * 1000, init } = {}) {
  const hit = readCache(key, ttlMs);
  if (hit !== null) return hit;
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  const value = await parse(res);
  writeCache(key, value);
  return value;
}
