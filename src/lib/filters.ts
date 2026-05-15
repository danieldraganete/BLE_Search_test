import { BleDevice, ScanAdvertisement } from '../types/ble-types';

export interface FilterState {
  nameFilter: string;
  uuidFilter: string;
  addressFilter: string;
  minRssi: number | null;
  maxRssi: number | null;
  connectable: 'all' | 'connectable' | 'non-connectable';
  showFavoritesOnly: boolean;
}

export function filterDevices(devices: BleDevice[], filters: FilterState): BleDevice[] {
  return devices.filter((d) => {
    if (filters.nameFilter &&
      (!d.name || !d.name.toLowerCase().includes(filters.nameFilter.toLowerCase()))) return false;
    if (filters.addressFilter &&
      !d.address.toLowerCase().includes(filters.addressFilter.toLowerCase())) return false;
    if (filters.uuidFilter) {
      const uuidMatch = d.uuids?.some((u) => u.toLowerCase().includes(filters.uuidFilter.toLowerCase())) ||
        d.advertisement?.uuids?.some((u) => u.toLowerCase().includes(filters.uuidFilter.toLowerCase()));
      if (!uuidMatch) return false;
    }
    if (filters.minRssi !== null && d.rssi < filters.minRssi) return false;
    if (filters.maxRssi !== null && d.rssi > filters.maxRssi) return false;
    if (filters.connectable === 'connectable' && !d.connectable) return false;
    if (filters.connectable === 'non-connectable' && d.connectable) return false;
    if (filters.showFavoritesOnly && !d.isFavorite) return false;
    return true;
  });
}

export type SortColumn = 'name' | 'address' | 'rssi' | 'lastSeen' | 'adCount';
export type SortDirection = 'asc' | 'desc';

export function sortDevices(
  devices: BleDevice[],
  column: SortColumn,
  direction: SortDirection
): BleDevice[] {
  const mult = direction === 'asc' ? 1 : -1;
  return [...devices].sort((a, b) => {
    switch (column) {
      case 'name':
        return mult * ((a.name || '').localeCompare(b.name || ''));
      case 'address':
        return mult * a.address.localeCompare(b.address);
      case 'rssi':
        return mult * (a.rssi - b.rssi);
      case 'lastSeen':
        return mult * (a.lastSeen - b.lastSeen);
      case 'adCount':
        return mult * (a.advertisementCount - b.advertisementCount);
      default:
        return 0;
    }
  });
}
