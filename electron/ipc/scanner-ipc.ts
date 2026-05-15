// Scanner IPC handlers - registers IPC channels for scanning operations
import { ipcMain, WebContents } from 'electron';
import { getScanner, BleScanner } from '../ble/scanner';

export async function setupScanIPC(_win: WebContents) {
  let scanner: BleScanner;

  try {
    scanner = getScanner();
  } catch (err: unknown) {
    const e = err as Error;
    _win.send('ble:scan:error', `Failed to initialize scanner: ${e.message}`);
    return;
  }

  // Forward events automatically
  scanner.on('scan:start', () => {
    _win.send('ble:scan:status', 'scanning');
  });
  scanner.on('scan:stop', () => {
    _win.send('ble:scan:status', 'stopped');
  });
  scanner.on('devices:update', (devices) => {
    _win.send('ble:scan:devices', devices);
  });
  scanner.on('scan:update', (data) => {
    _win.send('ble:scan:update', data);
  });
  scanner.on('state-change', (state) => {
    _win.send('ble:adapter:state', state);
  });

  ipcMain.handle('ble:scan:start', async (_e, args: { acceptAll?: boolean } | undefined) => {
    const acceptAll = args?.acceptAll ?? true;
    await scanner.startScanningAsync(acceptAll);
    return;
  });

  ipcMain.handle('ble:scan:stop', () => {
    return scanner.stopScanningAsync();
  });

  ipcMain.handle('ble:scan:state', () => {
    return scanner.isCurrentlyScanning() ? 'scanning' : 'idle';
  });

  ipcMain.handle('ble:scan:is-scanning', () => {
    return scanner.isCurrentlyScanning();
  });

  ipcMain.handle('ble:scan:devices', () => {
    return scanner.getDevices();
  });

  ipcMain.handle('ble:scan:reset', () => {
    return scanner.clearDevices();
  });

  ipcMain.handle('ble:export', (_e, format: 'json' | 'csv') => {
    return format === 'json' ? scanner.exportDevicesJSON() : scanner.exportDevicesCSV();
  });
}
