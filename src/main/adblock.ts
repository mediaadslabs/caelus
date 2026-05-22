import { Session } from 'electron';
import { ElectronBlocker } from '@ghostery/adblocker-electron';
import { fetch } from 'cross-fetch';

let blocker: ElectronBlocker | null = null;

export async function setupAdBlocking(session: Session): Promise<void> {
  try {
    blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);
    blocker.enableBlockingInSession(session);
  } catch (err) {
    console.warn('Ad blocker initialization failed:', err);
  }
}

export function disableAdBlocking(session: Session): void {
  if (blocker) {
    blocker.disableBlockingInSession(session);
    blocker = null;
  }
}
