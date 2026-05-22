import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

interface BangEntry {
  s: string;
  ts: string[];
  u: string;
}

let bangsCache: BangEntry[] | null = null;

function loadBangs(): BangEntry[] {
  if (bangsCache) return bangsCache;
  try {
    const bangsPath = path.join(app.getAppPath(), 'src', 'bangs', 'bangs.json');
    const devPath = path.join(__dirname, '..', '..', 'src', 'bangs', 'bangs.json');
    const prodPath = path.join(__dirname, 'bangs.json');

    let resolvedPath = prodPath;
    if (fs.existsSync(devPath)) resolvedPath = devPath;
    else if (fs.existsSync(bangsPath)) resolvedPath = bangsPath;

    const raw = fs.readFileSync(resolvedPath, 'utf-8');
    bangsCache = JSON.parse(raw) as BangEntry[];
    return bangsCache!;
  } catch {
    bangsCache = [];
    return bangsCache;
  }
}

function findBang(bangName: string): BangEntry | undefined {
  const bang = bangName.replace(/^!/, '').toLowerCase();
  return loadBangs().find((entry) => entry.ts.includes(bang));
}

export function resolveBangQuery(input: string): string | null {
  const trimmed = input.trim();

  const leadingMatch = trimmed.match(/^!(\S+)\s+(.+)/);
  if (leadingMatch) {
    const bang = findBang(leadingMatch[1]);
    if (bang) return bang.u.replace('{searchTerms}', encodeURIComponent(leadingMatch[2]));
  }

  const trailingMatch = trimmed.match(/^(.+)\s+!(\S+)$/);
  if (trailingMatch) {
    const bang = findBang(trailingMatch[2]);
    if (bang) return bang.u.replace('{searchTerms}', encodeURIComponent(trailingMatch[1]));
  }

  const justBang = trimmed.match(/^!(\S+)$/);
  if (justBang) {
    const bang = findBang(justBang[1]);
    if (bang) return bang.u.replace('{searchTerms}', '');
  }

  return null;
}
