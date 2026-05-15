import { create } from 'zustand';
import type { GattService, GattCharacteristic, RssiEntry } from '../types/ble-types';

interface RssiStore {
  deviceRssiMap: Map<string, RssiEntry[]>;
  setRssiHistory: (deviceId: string, entries: RssiEntry[]) => void;
  getRssiHistory: (deviceId: string) => RssiEntry[];
  setRssiDevice: (entries: RssiEntry[]) => void;
}

export const useRssiStore = create<RssiStore>((set, get) => ({
  deviceRssiMap: new Map(),
  setRssiHistory: (deviceId, entries) =>
    set((s) => {
      const map = new Map(s.deviceRssiMap);
      map.set(deviceId, entries);
      return { deviceRssiMap: map };
    }),
  getRssiHistory: (deviceId) => get().deviceRssiMap.get(deviceId) || [],
  setRssiDevice: (entries) =>
    set((s) => ({
      deviceRssiMap: new Map(s.deviceRssiMap).set('selected', entries),
    })),
}));
