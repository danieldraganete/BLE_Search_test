import { useEffect, useState, useCallback, useRef } from 'react';
import { useScannerStore } from '@/stores/scannerStore';
import { useElectron } from './useElectron';
import type { BleDevice } from '@/types/ble-types';

export function useBleScanner() {
  const { isElectron } = useElectron();
  const store = useScannerStore();
  const [connected, setConnected] = useState(false);
  const cleanupRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (!isElectron) return;

    cleanupRef.current.push(
      window.electronAPI.onScanDevices((devs: BleDevice[]) => {
        store.setDevices(devs);
      })
    );

    cleanupRef.current.push(
      window.electronAPI.onScanUpdate((ad: import('@/types/ble-types').ScanAdvertisement) => {
        store.updateDevice(ad.id, {
          lastSeen: ad.timestamp,
          rssi: ad.advertisements.rssi,
          connectable: ad.connectable,
          advertisementCount: (store.devices.find((d) => d.id === ad.id)?.advertisementCount || 0) + 1,
        });
      })
    );

    return () => {
      cleanupRef.current.forEach((cb) => cb());
      cleanupRef.current = [];
    };
  }, [isElectron]);

  const startScan = useCallback(async () => {
    if (!isElectron) return;
    try {
      await window.electronAPI.startScan();
      store.setIsScanning(true);
      store.setError(null);
      setConnected(true);
    } catch (err) {
      store.setError(err instanceof Error ? err.message : String(err));
    }
  }, [isElectron]);

  const stopScan = useCallback(async () => {
    if (!isElectron) return;
    try {
      await window.electronAPI.stopScan();
      store.setIsScanning(false);
      setConnected(false);
    } catch (err) {
      store.setError(err instanceof Error ? err.message : String(err));
    }
  }, [isElectron]);

  return {
    isScanning: store.isScanning,
    connected,
    startScan,
    stopScan,
    devices: store.devices,
  };
}
