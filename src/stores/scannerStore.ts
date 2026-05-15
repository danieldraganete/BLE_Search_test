import { create } from 'zustand';
import type { BleDevice, RssiEntry } from '../types/ble-types';
import type { FilterState, SortColumn, SortDirection } from '../lib/filters';

export interface ScannerStore {
  devices: BleDevice[];
  selectedDeviceId: string | null;
  isScanning: boolean;
  scanStartedAt: number | null;
  adapterState: 'poweredOn' | 'poweredOff' | 'unknown';
  filters: FilterState;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  activeTab: 'scanner' | 'analyzer' | 'gatt' | 'sniff';
  error: string | null;

  setDevices: (devices: BleDevice[]) => void;
  updateDevice: (deviceId: string, partial: Partial<BleDevice>) => void;
  setSelectedDevice: (id: string | null) => void;
  setIsScanning: (val: boolean) => void;
  setScanStartedAt: (ts: number | null) => void;
  setAdapterState: (state: 'poweredOn' | 'poweredOff' | 'unknown') => void;
  setFilters: (filters: Partial<FilterState>) => void;
  setSortColumn: (column: SortColumn) => void;
  toggleSortDirection: () => void;
  setActiveTab: (tab: 'scanner' | 'analyzer' | 'gatt' | 'sniff') => void;
  toggleFavorite: (deviceId: string) => void;
  setError: (error: string | null) => void;
}

const defaultFilters: FilterState = {
  nameFilter: '',
  uuidFilter: '',
  addressFilter: '',
  minRssi: null,
  maxRssi: null,
  connectable: 'all',
  showFavoritesOnly: false,
};

export const useScannerStore = create<ScannerStore>((set) => ({
  devices: [],
  selectedDeviceId: null,
  isScanning: false,
  scanStartedAt: null,
  adapterState: 'unknown',
  filters: defaultFilters,
  sortColumn: 'rssi',
  sortDirection: 'desc',
  activeTab: 'scanner',
  error: null,

  setDevices: (devices) => set({ devices }),
  updateDevice: (deviceId, partial) =>
    set((s) => ({
      devices: s.devices.map((d) => (d.id === deviceId ? { ...d, ...partial } : d)),
    })),
  setSelectedDevice: (id) => set({ selectedDeviceId: id }),
  setIsScanning: (val) => set({ isScanning: val }),
  setScanStartedAt: (ts) => set({ scanStartedAt: ts }),
  setAdapterState: (state) => set({ adapterState: state }),
  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
  setSortColumn: (column) => set({ sortColumn: column }),
  toggleSortDirection: () =>
    set((s) => ({ sortDirection: s.sortDirection === 'asc' ? 'desc' : 'asc' })),
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleFavorite: (deviceId) =>
    set((s) => ({
      devices: s.devices.map((d) =>
        d.id === deviceId ? { ...d, isFavorite: !d.isFavorite } : d
      ),
    })),
  setError: (error) => set({ error }),
}));
