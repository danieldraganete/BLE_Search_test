import {
  BleDevice,
  ScanAdvertisement,
  ScanSession,
  GattService,
  GattCharacteristic,
  ConnectionInfo,
  RssiEntry,
  Advertisement,
} from './ble-types';

export interface IPCChannels {
  // Scanner IPC
  'ble:scan:start': { input: { name?: string; uuids?: string[] } | undefined; output: void };
  'ble:scan:stop': { input: void; output: void };
  'ble:scan:state': { input: void; output: 'scanning' | 'idle' };
  'ble:scan:devices': { input: void; output: BleDevice[] };
  'ble:scan:reset': { input: void; output: void };
  'ble:export': { input: { devices: BleDevice[]; format: 'json' | 'csv' }; output: void };

  // GATT IPC
  'ble:gatt:connect': { input: string; output: boolean };
  'ble:gatt:disconnect': { input: string; output: void };
  'ble:gatt:services': { input: string; output: GattService[] };
  'ble:gatt:read': { input: number; output: string };
  'ble:gatt:write': {
    input: { characteristic: GattCharacteristic; value: string };
    output: { success: boolean; dataSent: number };
  };
  'ble:gatt:notification': {
    input: { handle: number; enable: boolean };
    output: boolean;
  };
  'ble:gatt:connection': { input: string; output: ConnectionInfo };
  'ble:gatt:descriptor:read': { input: number; output: string };
  'ble:gatt:descriptor:write': {
    input: { handle: number; value: string };
    output: boolean;
  };

  // Events
  'ble:scan:update': { payload: ScanAdvertisement };
  'ble:scan:devices': { payload: BleDevice[] };
  'ble:gatt:value': {
    payload: { characteristicUuid: string; value: string };
  };
}

export interface ElectronAPI {
  startScan: (options?: { name?: string; uuids?: string[] }) => Promise<void>;
  stopScan: () => Promise<void>;
  getScanState: () => Promise<'scanning' | 'idle'>;
  getDevices: () => Promise<BleDevice[]>;
  resetScan: () => Promise<void>;

  onScanUpdate: (cb: (data: ScanAdvertisement) => void) => () => void;
  onScanDevices: (cb: (devices: BleDevice[]) => void) => () => void;

  connect: (deviceId: string) => Promise<void>;
  disconnect: (deviceId: string) => Promise<void>;
  getServices: (deviceId: string) => Promise<GattService[]>;
  readCharacteristic: (handle: number) => Promise<string>;
  writeCharacteristic: (args: {
    characteristic: GattCharacteristic;
    value: string;
  }) => Promise<{ success: boolean; dataSent: number }>;
  requestNotification: (
    handle: number,
    enable: boolean
  ) => Promise<boolean>;
  onValueChanged: (
    cb: (data: { characteristicUuid: string; value: string }) => void
  ) => () => void;
  getConnectionInfo: (deviceId: string) => Promise<ConnectionInfo>;
  readDescriptor: (handle: number) => Promise<string>;
  writeDescriptor: (args: { handle: number; value: string }) => Promise<boolean>;

  exportDevices: (devices: BleDevice[], format: 'json' | 'csv') => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
