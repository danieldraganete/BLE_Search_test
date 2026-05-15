// BLE Scanner — manages noble scanning with Windows native bindings
import { EventEmitter } from 'events';
import noble from '@stoprocent/noble';
import getCompanyName from './manufacturer';
import { BleDevice, ScanAdvertisement, Advertisement } from '../../src/types/ble-types';

let scannerInstance: BleScanner | null = null;

export function getScanner(): BleScanner {
  if (!scannerInstance) {
    scannerInstance = new BleScanner();
  }
  return scannerInstance;
}

export class BleScanner extends EventEmitter {
  private deviceMap = new Map<string, BleDevice>();
  private isScanning = false;
  private scanState: 'idle' | 'scanning' = 'idle';

  constructor() {
    super();
    noble.on('stateChange', this._onStateChange.bind(this));
    noble.on('discover', this._onDiscover.bind(this));
  }

  getState(): 'poweredOn' | 'poweredOff' | 'unknown' {
    return (noble.state || 'unknown') as 'poweredOn' | 'poweredOff' | 'unknown';
  }

  async startScanningAsync(
    acceptAllDevices = true,
    options?: {
      acceptConnectable?: boolean;
      acceptDuplicates?: boolean;
      acceptPoweredPeripheral?: boolean;
      duration?: number;
    }
  ): Promise<void> {
    const state = this.getState();
    if (state !== 'poweredOn') {
      this.emit('error', new Error('Bluetooth adapter is not powered on'));
      return;
    }

    if (this.isScanning) return;

    await noble.startScanningAsync([], {
      acceptAllDevices,
      ...options,
    });

    this.isScanning = true;
    this.scanState = 'scanning';
    this.emit('scan:start');

    if (options?.duration) {
      setTimeout(() => this.stopScanningAsync(), options.duration * 1000);
    }
  }

  async stopScanningAsync(): Promise<void> {
    if (!this.isScanning) return;
    await noble.stopScanningAsync();
    this.isScanning = false;
    this.scanState = 'idle';
    this.emit('scan:stop');
  }

  isCurrentlyScanning(): boolean {
    return this.isScanning;
  }

  getDevices(): BleDevice[] {
    return Array.from(this.deviceMap.values()).sort((a, b) => {
      if (a.isConnected !== b.isConnected) return b.isConnected ? 1 : -1;
      return b.rssi - a.rssi;
    });
  }

  getDevice(deviceId: string): BleDevice | undefined {
    return this.deviceMap.get(deviceId);
  }

  clearDevices(): void {
    this.deviceMap.clear();
    this.emit('devices:update', this.getDevices());
  }

  toggleFavorite(deviceId: string): void {
    const device = this.deviceMap.get(deviceId);
    if (device) {
      device.isFavorite = !device.isFavorite;
      this.emit('devices:update', this.getDevices());
    }
  }

  private _onStateChange(state: string): void {
    this.emit('state-change', state);
  }

  private _onDiscover(raw: Advertisement): void {
    const deviceId = raw.id;
    const existing = this.deviceMap.get(deviceId);

    const manufacturerData = this._parseManufacturerData(raw.manufacturerData);
    const serviceData = this._parseServiceData(raw.serviceData);
    const hexData = this._bufferToHex(raw.manufacturerData?.[0]?.data);
    const rawAdvertising = this._bufferToHex(raw.data);

    const advertisement: Advertisement = {
      uuids: raw.uuids || [],
      name: raw.name || null,
      rssi: raw.rssi,
      txPowerLevel: raw.txPowerLevel || null,
      manufacturerData,
      serviceData,
      raw: rawAdvertising,
    };

    const device: BleDevice = {
      id: deviceId,
      address: raw.id,
      addressType: raw.addressType || 'unknown',
      name: raw.name || null,
      rssi: raw.rssi,
      isFavorite: existing?.isFavorite || false,
      isConnected: existing?.isConnected || false,
      advertisementCount: (existing?.advertisementCount || 0) + 1,
      firstSeen: existing?.firstSeen || Date.now(),
      lastSeen: Date.now(),
      connectable: raw.connectable || false,
      advertisement,
      uuids: raw.uuids || [],
      rssiHistory: existing
        ? [...existing.rssiHistory.slice(-500), { rssi: raw.rssi, timestamp: Date.now() }]
        : [{ rssi: raw.rssi, timestamp: Date.now() }],
      notes: existing?.notes || '',
      estimatedInterval: existing
        ? this._estimateInterval(existing.lastSeen, Date.now(), raw.rssi)
        : undefined,
    };

    this.deviceMap.set(deviceId, device);
    this.emit('scan:update', {
      id: deviceId,
      address: raw.id,
      addressType: raw.addressType || 'unknown',
      connectable: raw.connectable || false,
      advertisements: advertisement,
      timestamp: Date.now(),
    } as ScanAdvertisement);
    this.emit('devices:update', this.getDevices());
  }

  private _parseManufacturerData(manufData?: { data: ArrayBuffer; companyId: number }[]): {
    type: string;
    data: string;
    companyId: number;
    companyName?: string;
  }[] {
    if (!manufData) return [];
    return manufData.map((m) => ({
      type: 'manufacturer',
      data: this._bufferToHex(m.data),
      companyId: m.companyId,
      companyName: getCompanyName(m.companyId),
    }));
  }

  private _parseServiceData(serviceData?: { uuid: string; data: ArrayBuffer }[]): {
    uuid: string;
    data: string;
  }[] {
    if (!serviceData) return [];
    return serviceData.map((s) => ({
      uuid: s.uuid,
      data: this._bufferToHex(s.data),
    }));
  }

  private _bufferToHex(buf: ArrayBuffer | Uint8Array | undefined | string): string {
    if (!buf) return '';
    if (typeof buf === 'string') return buf;
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private _estimateInterval(lastSeen: number, now: number, currentRssi: number): number | undefined {
    return Math.round(now - lastSeen) % 1000;
  }

  exportDevicesJSON(): string {
    return JSON.stringify(this.getDevices(), null, 2);
  }

  exportDevicesCSV(): string {
    const devices = this.getDevices();
    const header = 'Address,Name,RSSI,Connectable,First Seen,Last Seen,Advertisement Count\n';
    const rows = devices
      .map((d) =>
        [
          d.address,
          `"${d.name || ''}"`,
          d.rssi,
          d.connectable,
          new Date(d.firstSeen).toISOString(),
          new Date(d.lastSeen).toISOString(),
          d.advertisementCount,
        ].join(',')
      )
      .join('\n');
    return header + rows;
  }
}
