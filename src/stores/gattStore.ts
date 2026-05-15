import { create } from 'zustand';
import type { GattService, GattCharacteristic, GattDescriptor } from '../types/ble-types';

interface GattStore {
  services: GattService[];
  connected: boolean;
  connecting: boolean;
  connectedDeviceId: string | null;
  subscriptionHandles: Set<number>;
  notifications: { characteristicUuid: string; value: string }[];

  setServices: (services: GattService[]) => void;
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setConnectedDeviceId: (id: string | null) => void;
  subscribeCharacteristic: (handle: number) => void;
  unsubscribeCharacteristic: (handle: number) => void;
  addNotification: (data: { characteristicUuid: string; value: string }) => void;
  clearNotifications: () => void;
  clear: () => void;
}

export const useGattStore = create<GattStore>((set) => ({
  services: [],
  connected: false,
  connecting: false,
  connectedDeviceId: null,
  subscriptionHandles: new Set(),
  notifications: [],

  setServices: (services) => set({ services }),
  setConnected: (connected) => set({ connected }),
  setConnecting: (connecting) => set({ connecting }),
  setConnectedDeviceId: (id) => set({ connectedDeviceId: id }),
  subscribeCharacteristic: (handle) =>
    set((s) => ({
      subscriptionHandles: new Set(s.subscriptionHandles).add(handle),
    })),
  unsubscribeCharacteristic: (handle) =>
    set((s) => {
      const set = new Set(s.subscriptionHandles);
      set.delete(handle);
      return { subscriptionHandles: set };
    }),
  addNotification: (data) =>
    set((s) => ({ notifications: [...s.notifications.slice(-99), data] })),
  clearNotifications: () => set({ notifications: [] }),
  clear: () =>
    set({
      services: [],
      connected: false,
      connecting: false,
      connectedDeviceId: null,
      subscriptionHandles: new Set(),
      notifications: [],
    }),
}));
