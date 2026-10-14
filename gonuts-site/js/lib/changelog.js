/* Parses the dated entries of CHANGELOG.md. Pure functions, no DOM: unit-tested in tests/run.js. */

const HEADING = /^##\s+(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?:\s*UTC)?\s*$/;
const BULLET = /^\s*[-*]\s+(.+?)\s*$/;
const KIND = /^(New|Fixed|Changed):\s*(.*)$/;

/** @returns {{at: Date, lines: string[]}[]} newest first; entries without bullets are dropped. */
export function parseChangelog(text) {
  const entries = [];
  let current = null;
  for (const line of String(text).split(/\r?\n/)) {
    const heading = HEADING.exec(line.trim());
    if (heading) {
      const at = new Date(`${heading[1]}T${heading[2]}:00Z`);
      current = Number.isNaN(at.getTime()) ? null : { at, lines: [] };
      if (current) entries.push(current);
      continue;
    }
    if (line.startsWith('#')) { current = null; continue; }
    if (!current) continue;
    const bullet = BULLET.exec(line);
    if (bullet) current.lines.push(bullet[1]);
    else if (line.trim() && /^\s/.test(line) && current.lines.length) current.lines[current.lines.length - 1] += ` ${line.trim()}`;
  }
  return entries.filter((e) => e.lines.length).sort((a, b) => b.at - a.at);
}

/** Strips the markdown the changelog uses and splits off a leading "New:" / "Fixed:" / "Changed:" tag. */
export function splitKind(line) {
  const clean = String(line).replace(/\*\*/g, '').replace(/`/g, '');
  const m = KIND.exec(clean);
  return m ? { kind: m[1], text: m[2] } : { kind: null, text: clean };
}
