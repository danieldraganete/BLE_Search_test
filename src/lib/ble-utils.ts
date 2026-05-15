import { BleDevice } from '../types/ble-types';

/** Format buffer/arraybuffer as hex string */
export function bufToHex(buf: ArrayBuffer | string | Uint8Array | undefined | null): string {
  if (!buf) return '';
  if (typeof buf === 'string') return buf;
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/** Format hex string as spaced pairs */
export function formatHex(hex: string): string {
  return hex
    .replace(/(.{2})/g, '$1 ')
    .trim()
    .toUpperCase();
}

/** Parse hex string to ArrayBuffer */
export function hexToBuf(hex: string): Uint8Array {
  const clean = hex.replace(/[^0-9A-Fa-f]/g, '');
  const arr = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    arr[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return arr;
}

/** Shorten UUID for display */
export function shortenUuid(uuid: string): string {
  // 128-bit UUIDs
  if (uuid.length === 36) return uuid;
  // 16-bit short form
  if (uuid.length === 4) return uuid;
  // 32-bit short form
  if (uuid.length === 8) return uuid;
  return uuid;
}

/** Expand 16-bit UUID to 128-bit */
export function expandUuid(uuid: string): string {
  if (uuid.length === 4) {
    return `0000${uuid}-0000-1000-8000-00805f9b34fb`;
  }
  if (uuid.length === 8) {
    return uuid.slice(0, 8) + '-0000-1000-8000-00805f9b34fb';
  }
  return uuid;
}

/** Format RSSI with signal bar representation */
export function rssiToBars(rssi: number): number {
  if (rssi >= -55) return 4;
  if (rssi >= -65) return 3;
  if (rssi >= -75) return 2;
  if (rssi >= -85) return 1;
  return 0;
}

/** Format RSSI string */
export function rssiString(rssi: number): string {
  if (rssi >= -55) return 'Excellent';
  if (rssi >= -65) return 'Good';
  if (rssi >= -75) return 'Fair';
  if (rssi >= -85) return 'Poor';
  return 'Very Weak';
}

/** Format device address with colons */
export function formatAddress(mac: string): string {
  if (mac.length !== 12 || !/[0-9A-Fa-f]{12}/.test(mac)) return mac;
  return mac.replace(/(.{2})/g, '$1:').slice(0, -1);
}

/** Format timestamp relative */
export function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return `${Math.round(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
  return `${Math.round(diff / 3600000)}h ago`;
}

/** Estimate advertising interval */
export function estimateInterval(entries: { timestamp: number; rssi: number }[], minEntries = 2): number | null {
  if (entries.length < minEntries) return null;
  const intervals = [];
  for (let i = 1; i < entries.length; i++) {
    intervals.push(entries[i].timestamp - entries[i - 1].timestamp);
  }
  return Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);
}

/** Decode advertising data type to human-readable */
export function adTypeToString(type: number): string {
  const map: Record<number, string> = {
    0x01: 'Flags',
    0x02: 'Incomplete 16-bit UUIDs',
    0x03: 'Complete 16-bit UUIDs',
    0x04: 'Incomplete 32-bit UUIDs',
    0x05: 'Complete 32-bit UUIDs',
    0x06: 'Incomplete 128-bit UUIDs',
    0x07: 'Complete 128-bit UUIDs',
    0x08: 'Shortened Local Name',
    0x09: 'Complete Local Name',
    0x0A: 'tx Power Level',
    0x0B: 'Class of Device',
    0x0C: 'Simple Pairing Hash',
    0x0D: 'Simple Pairing Randomizer',
    0x0E: 'Security Manager TK',
    0x0F: 'Security Manager OOB Flags',
    0x10: 'Slave Connection Interval Range',
    0x12: 'Listed Service UUIDs (16-bit)',
    0x13: 'Compressed Service UUIDs (16-bit)',
    0x14: 'Compressed Service UUIDs (32-bit)',
    0x15: 'Compressed Service UUIDs (128-bit)',
    0x16: 'Service Data (16-bit UUID)',
    0x17: 'Public Target Address',
    0x18: 'Random Target Address',
    0x19: 'Appearance',
    0x1A: 'Advertising Interval',
    0x1B: 'LER Address',
    0x1C: 'LE Role',
    0x1D: 'Simple Pairing Simple',
    0x1E: 'List of 16-bit Sol.',
    0x1F: 'List of 32-bit Sol.',
    0x20: 'Service Data (32-bit UUID)',
    0x24: 'Service Data (128-bit UUID)',
    0x25: 'LE Secure Connections',
    0x26: 'URI',
    0x27: 'Indoor',
    0x28: 'Transport Discovery Hash',
    0x29: 'Transport Discovery Transport',
    0x2D: '3D Information Data',
    0x32: 'Ranging Measurement Data',
    0x34: 'Ranging Data',
    0x39: 'Ranging Data (2)',
    0xFF: 'Manufacturer Specific Data',
  };
  return map[type] || `Unknown (0x${type.toString(16)})`;
}

/** Parse raw advertising hex data into AD structure objects */
export function parseAdStructure(hexString: string): AdField[] {
  const adFields: AdField[] = [];
  const bytes = hexToBuf(hexString);

  let i = 0;
  while (i < bytes.length) {
    const length = bytes[i];
    if (i + 1 + length > bytes.length) break;
    const type = bytes[i + 1];
    const data = bytes.subarray(i + 2, i + 2 + length);
    adFields.push({
      type,
      typeName: adTypeToString(type),
      length,
      data,
      hex: Array.from(data).map((b) => b.toString(16).padStart(2, '0')).join(''),
      ascii: Array.from(data)
        .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
        .join(''),
    });
    i += 2 + length;
  }
  return adFields;
}

export interface AdField {
  type: number;
  typeName: string;
  length: number;
  data: Uint8Array;
  hex: string;
  ascii: string;
}

/** Decode flags */
export function decodeFlags(hexString: string): string[] {
  const flags: string[] = [];
  const byte = parseInt(hexString, 16);
  if (byte & 0x01) flags.push('LE General Discoverable');
  if (byte & 0x02) flags.push('LE General Discoverable');
  if (byte & 0x04) flags.push('BR/EDR Not Supported');
  if (byte & 0x08) flags.push('Simultaneous LE + BR/EDR (Controller)');
  if (byte & 0x10) flags.push('Simultaneous LE + BR/EDR (Host)');
  return flags;
}
