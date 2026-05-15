'use client';

import { useState } from 'react';
import { useGattStore } from '@/stores/gattStore';
import { useScannerStore } from '@/stores/scannerStore';
import { GattExplorer } from './GattExplorer';
import { CharacteristicDetail } from './CharacteristicView';

export function GattViewComponent() {
  const { selectedDeviceId, devices } = useScannerStore();
  const { services, connected, setConnected, setServices, setConnectedDeviceId } = useGattStore();
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const device = devices.find((d) => d.id === selectedDeviceId);

  return (
    <div className="h-full flex">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-4">
          <h2 className="font-bold text-lg">GATT Explorer</h2>
          <span className="text-muted-foreground text-sm">
            {device ? device.name || device.address : 'No device selected'}
          </span>
          <div className="flex-1" />

          {connectionError && (
            <span className="text-red-400 text-sm">{connectionError}</span>
          )}

          {!connected ? (
            <button
              onClick={() => handleConnect()}
              disabled={!device}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40"
            >
              Connect
            </button>
          ) : (
            <button
              onClick={() => handleDisconnect()}
              className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Disconnect
            </button>
          )}

          <span className={`inline-block w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-slate-500'}`} />
        </div>

        <div className="flex-1 overflow-auto">
          {!device ? (
            <div className="text-center text-muted-foreground mt-12">Select a device first</div>
          ) : (
            <div className="flex">
              <div className="w-3/5 overflow-auto">
                <GattExplorer />
              </div>
              <CharacteristicDetail />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  async function handleConnect() {
    if (!device) return;
    setConnectionError(null);
    setConnectedDeviceId(device.id);
    try {
      const ok = await window.electronAPI.connect(device.id);
      if (ok) {
        setConnected(true);
        await discoverServices();
      }
    } catch (e: unknown) {
      setConnectionError(String(e));
    }
  }

  async function handleDisconnect() {
    if (!device) return;
    await window.electronAPI.disconnect(device.id);
    setConnected(false);
    setServices([]);
  }

  async function discoverServices() {
    if (!device) return;
    try {
      const svc = await window.electronAPI.getServices(device.id);
      setServices(svc);
    } catch (e: unknown) {
      setConnectionError(String(e));
    }
  }
}
