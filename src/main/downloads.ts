import { BrowserWindow, DownloadItem, app } from 'electron';
import * as path from 'path';

export function setupDownloadHandler(win: BrowserWindow): void {
  win.webContents.session.on('will-download', (_event: Electron.Event, item: DownloadItem) => {
    const filename = item.getFilename();
    const filePath = path.join(app.getPath('downloads'), filename);

    item.setSavePath(filePath);

    item.on('done', (_event: Electron.Event, state: string) => {
      if (state === 'completed') {
        win.webContents.send('download:completed', { filename, filePath });
      } else if (state === 'cancelled') {
        win.webContents.send('download:cancelled', { filename });
      }
    });
  });
}
