import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Scanner
  startScan: (acceptAll?: boolean) => ipcRenderer.invoke('ble:scan:start', { acceptAll }),
  stopScan: () => ipcRenderer.invoke('ble:scan:stop'),
  getScanState: () => ipcRenderer.invoke('ble:scan:state'),
  isScanning: () => ipcRenderer.invoke('ble:scan:is-scanning'),
  getDevices: () => ipcRenderer.invoke('ble:scan:devices'),
  resetScan: () => ipcRenderer.invoke('ble:scan:reset'),

  onScanUpdate: (cb: (data: unknown) => void) => {
    const handler = (_e: Electron.IpcMessageEvent, data: unknown) => cb(data as never);
    ipcRenderer.on('ble:scan:update', handler);
    return () => ipcRenderer.removeListener('ble:scan:update', handler);
  },
  onScanDevices: (cb: (devices: unknown[]) => void) => {
    const handler = (_e: Electron.IpcMessageEvent, devices: unknown[]) => cb(devices as never[]);
    ipcRenderer.on('ble:scan:devices', handler);
    return () => ipcRenderer.removeListener('ble:scan:devices', handler);
  },
  onScanError: (cb: (err: string) => void) => {
    const handler = (_e: Electron.IpcMessageEvent, err: string) => cb(err as never);
    ipcRenderer.on('ble:scan:error', handler);
    return () => ipcRenderer.removeListener('ble:scan:error', handler);
  },

  // GATT
  connect: (deviceId: string) => ipcRenderer.invoke('ble:gatt:connect', deviceId),
  disconnect: (deviceId: string) => ipcRenderer.invoke('ble:gatt:disconnect', deviceId),
  getServices: (deviceId: string) => ipcRenderer.invoke('ble:gatt:services', deviceId),
  readCharacteristic: (characteristicUuid: string) => ipcRenderer.invoke('ble:gatt:read', characteristicUuid),
  writeCharacteristic: (args: { characteristicUuid: string; value: string; withoutResponse?: boolean }) =>
    ipcRenderer.invoke('ble:gatt:write', args),
  requestNotification: (args: { characteristicUuid: string; enable: boolean }) =>
    ipcRenderer.invoke('ble:gatt:notification', args),
  onValueChanged: (cb: (data: { characteristicUuid: string; value: string }) => void) => {
    const handler = (_e: Electron.IpcMessageEvent, data: { characteristicUuid: string; value: string }) =>
      cb(data as never);
    ipcRenderer.on('ble:gatt:value', handler);
    return () => ipcRenderer.removeListener('ble:gatt:value', handler);
  },
  getConnectionInfo: (deviceId: string) => ipcRenderer.invoke('ble:gatt:connection', deviceId),

  // Export
  exportDevices: (format: 'json' | 'csv') => ipcRenderer.invoke('ble:export', format),
  onAdapterState: (cb: (state: string) => void) => {
    const handler = (_e: Electron.IpcMessageEvent, state: string) => cb(state as never);
    ipcRenderer.on('ble:adapter:state', handler);
    return () => ipcRenderer.removeListener('ble:adapter:state', handler);
  },
});
