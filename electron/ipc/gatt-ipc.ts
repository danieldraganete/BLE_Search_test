// GATT IPC handlers - registers IPC channels for GATT operations
import { ipcMain, WebContents } from 'electron';
import noble from '@stoprocent/noble';

export async function setupGattIPC(_win: WebContents) {
  // Connect to device
  ipcMain.handle('ble:gatt:connect', async (_e, deviceId: string) => {
    try {
      await noble.connectAsync(deviceId);
      return true;
    } catch (err: unknown) {
      const e = err as Error;
      _win.send('ble:gatt:error', e.message);
      return false;
    }
  });

  // Disconnect from device
  ipcMain.handle('ble:gatt:disconnect', (_e, deviceId: string) => {
    noble.disconnect(deviceId);
  });

  // Discover services and characteristics
  ipcMain.handle('ble:gatt:services', async (_e, _deviceId: string) => {
    const services = await noble.discoverServicesAsync();
    return services.map((s) => ({
      uuid: s.uuid,
      handle: s.uuid,
      characteristics: [],
    }));
  });

  // Read characteristic
  ipcMain.handle('ble:gatt:read', async (_e, characteristicUuid: string) => {
    const value = await noble.readAsync(characteristicUuid);
    return bufferToHex(value);
  });

  // Write characteristic
  ipcMain.handle('ble:gatt:write', async (_e, args: { characteristicUuid: string; value: string; withoutResponse?: boolean }) => {
    const buffer = hexToBuffer(args.value);
    const sent = await noble.writeAsync(args.characteristicUuid, buffer, args.withoutResponse ?? false);
    return { success: true, dataSent: buffer.length };
  });

  // Enable/disable notifications
  ipcMain.handle('ble:gatt:notification', (_e, args: { characteristicUuid: string; enable: boolean }) => {
    noble.enableNotifications(args.characteristicUuid);
    noble.disableNotifications(args.characteristicUuid);
  });
}

function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): Uint8Array {
  const clean = hex.replace(/[^0-9A-Fa-f]/g, '');
  const arr = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    arr[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return arr;
}
