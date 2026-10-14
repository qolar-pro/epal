/** Small formatting helpers shared by the page scripts and the tests. */

export const MB = 1048576;

/** "m:ss" for a number of seconds. */
export function clock(sec) {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Picks the mod jar out of a GitHub release's assets, e.g. GoNuts-0.1.0-mc26.2.jar. */
export function pickJar(assets = []) {
  return assets.find((a) => /^gonuts-[0-9].*-mc.*\.jar$/i.test(a.name)) || null;
}

/** "26.2" out of "GoNuts-0.1.0-mc26.2.jar", or null. */
export function minecraftVersion(fileName) {
  const m = /-mc(\d+(?:\.\d+)*)\.jar$/i.exec(fileName);
  return m ? m[1] : null;
}

export function describeBuild(jar, formatDate) {
  return `Latest build: ${formatDate(new Date(jar.updated_at))}, ${(jar.size / MB).toFixed(1)} MB`;
}
