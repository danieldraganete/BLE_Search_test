'use client';

import { useEffect, useCallback, useRef } from 'react';
import { Play, Square, Radio, RadioTower } from 'lucide-react';
import { useScannerStore } from '@/stores/scannerStore';
import type { BleDevice } from '@/types/ble-types';

declare global {
  interface Window {
    electronAPI: {
      startScan: (options?: { acceptAll?: boolean }) => Promise<void>;
      stopScan: () => Promise<void>;
      onScanDevices: (cb: (devices: unknown[]) => void) => () => void;
      onScanUpdate: (cb: (data: unknown) => void) => () => void;
      onScanError: (cb: (err: string) => void) => () => void;
      onAdapterState: (cb: (state: string) => void) => () => void;
    };
  }
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const parts: string[] = [];

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);

  return parts.join(' ');
}

export function ScanControls() {
  const {
    isScanning,
    setIsScanning,
    scanStartedAt,
    setScanStartedAt,
    setDevices,
    devices,
    adapterState,
    setError,
  } = useScannerStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleStartScan = useCallback(async () => {
    try {
      await window.electronAPI.startScan({ acceptAll: true });
      setIsScanning(true);
      setScanStartedAt(Date.now());
    } catch (err: unknown) {
      const e = err as Error;
      setError(`Scan failed: ${e.message}`);
    }
  }, [setIsScanning, setScanStartedAt, setError]);

  const handleStopScan = useCallback(async () => {
    try {
      await window.electronAPI.stopScan();
      setIsScanning(false);
      setScanStartedAt(null);
    } catch (err) {
      // ignore
    }
  }, [setIsScanning, setScanStartedAt]);

  useEffect(() => {
    const unsubDevices = window.electronAPI.onScanDevices((devices: unknown[]) => {
      const typed = devices as BleDevice[];
      setDevices(typed);
    });

    const unsubError = window.electronAPI.onScanError((err: string) => {
      setError(err);
    });

    const unsubAdapter = window.electronAPI.onAdapterState((state: string) => {
      const mapped = state as 'poweredOn' | 'poweredOff' | 'unknown';
      useScannerStore.getState().setAdapterState(mapped);
    });

    return () => {
      unsubDevices();
      unsubError();
      unsubAdapter();
    };
  }, [setDevices, setError]);

  useEffect(() => {
    if (isScanning && scanStartedAt) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        // keep scanning alive
      }, 60000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isScanning, scanStartedAt]);

  const duration = scanStartedAt
    ? formatDuration(Date.now() - scanStartedAt)
    : '--';

  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-white border-b border-slate-200">
      <button
        onClick={isScanning ? handleStopScan : handleStartScan}
        disabled={adapterState === 'poweredOff' || adapterState === 'unknown'}
        className={`
          inline-flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-sm
          transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed
          ${
            isScanning
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-200'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200'
          }
        `}
      >
        {isScanning ? (
          <Square className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
        {isScanning ? 'Stop Scan' : 'Start Scan'}
      </button>

      <div className="flex items-center gap-4 ml-auto text-sm text-slate-600">
        {isScanning && <Radio className="w-4 h-4 text-blue-500 animate-pulse" />}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Duration</span>
          <span className="font-mono font-medium text-slate-800">{duration}</span>
        </div>
        <div className="h-5 w-px bg-slate-200" />
        <div className="flex items-center gap-1.5">
          <RadioTower className="w-4 h-4 text-slate-400" />
          <span className="text-slate-400">Devices</span>
          <span className="inline-flex items-center justify-center min-w-[2ch] px-1.5 py-0.5 text-xs font-bold rounded-full font-mono bg-slate-100 text-slate-800">
            {devices.length}
          </span>
        </div>

        <div className="ml-2 px-2 py-0.5 text-xs rounded-full border font-medium" style={{
          borderColor: adapterState === 'poweredOn' ? '#f0fdf4' : '#fef2f2',
          color: adapterState === 'poweredOn' ? '#16a34a' : (adapterState === 'poweredOff' ? '#dc2626' : '#6b7280'),
          backgroundColor: adapterState === 'poweredOn' ? '#f0fdf4' : (adapterState === 'poweredOff' ? '#fef2f2' : '#f3f4f6'),
        }}>
          {adapterState === 'poweredOn' ? 'Powered On' : adapterState === 'poweredOff' ? 'Powered Off' : 'Unknown'}
        </div>
      </div>
    </div>
  );
}
