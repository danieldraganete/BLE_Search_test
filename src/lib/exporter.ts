import { BleDevice, GattService, GattCharacteristic, GattDescriptor } from '../types/ble-types';

export function deviceToExportJSON(devices: BleDevice[]): string {
  return JSON.stringify(devices, (_key: unknown, value: unknown) =>
    typeof (value as any)?.rssiHistory?.length === 'number' && (value as any).rssiHistory.length > 100
      ? { ...value, rssiHistory: value.rssiHistory.slice(-50) }
      : value
  , 2);
}

export function deviceToCsv(devices: BleDevice[]): string {
  const header = 'Address,Name,Manufacturer,RSSI (dBm),Connectable,First Seen,Last Seen,Scans,UUIDs\n';
  const rows = devices.map((d) =>
    [
      d.address,
      `"${(d.name || '').replace(/"/g, '""')}"`,
      d.advertisement?.manufacturerData?.map((m) => m.companyName || String(m.companyId)).join(';') || '',
      d.rssi,
      d.connectable,
      new Date(d.firstSeen).toISOString(),
      new Date(d.lastSeen).toISOString(),
      d.advertisementCount,
      (d.uuids || []).join(';'),
    ].join(',')
  ).join('\n');
  return header + rows;
}
