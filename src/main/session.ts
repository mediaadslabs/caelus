import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

interface SavedTab {
  url: string;
  title: string;
  pinned: boolean;
}

interface SessionData {
  tabs: SavedTab[];
  activeIndex: number;
}

const sessionPath = path.join(app.getPath('userData'), 'session.json');

export function saveSession(tabs: SavedTab[], activeIndex: number): void {
  try {
    const data: SessionData = { tabs, activeIndex };
    fs.writeFileSync(sessionPath, JSON.stringify(data), 'utf-8');
  } catch {
    console.warn('Failed to save session');
  }
}

export function loadSession(): SessionData | null {
  try {
    if (!fs.existsSync(sessionPath)) return null;
    const raw = fs.readFileSync(sessionPath, 'utf-8');
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    if (fs.existsSync(sessionPath)) {
      fs.unlinkSync(sessionPath);
    }
  } catch {
    console.warn('Failed to clear session');
  }
}
