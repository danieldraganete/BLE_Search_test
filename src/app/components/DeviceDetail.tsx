'use client';

import { useState, useRef } from 'react';
import { useScannerStore } from '@/stores/scannerStore';
import type { BleDevice } from '@/types/ble-types';
import { formatAddress, formatTimeAgo, formatHex, parseAdStructure, adTypeToString, bufToHex } from '@/lib/ble-utils';
import { useElectron } from '@/hooks/useElectron';

export function DeviceDetail() {
  const { selectedDeviceId, devices, selectedDeviceId, toggleFavorite } = useScannerStore();
  const device = devices.find((d) => d.id === selectedDeviceId);

  if (!device) {
    return (
      <div className="w-80 border-l border-border p-4 bg-secondary/20">
        <p className="text-sm text-muted-foreground">Select a device to view details</p>
      </div>
    );
  }

  return (
    <div className="w-80 border-l border-border p-4 overflow-auto bg-secondary/20 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{device.name || 'Unknown Device'}</h3>
        <button
          onClick={() => toggleFavorite(device.id)}
          className="text-lg"
        >
          {device.isFavorite ? '★' : '☆'}
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <span className="text-muted-foreground">Address:</span>
          <span className="ml-2 font-mono">{formatAddress(device.address)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">RSSI:</span>
          <span className="ml-2 font-mono text-emerald-400">{device.rssi} dBm</span>
        </div>
        <div>
          <span className="text-muted-foreground">Connectable:</span>
          <span className={`ml-2 ${device.connectable ? 'text-emerald-400' : 'text-muted-foreground'}`}>
            {device.connectable ? 'Yes' : 'No'}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Last Seen:</span>
          <span className="ml-2 font-mono">{formatTimeAgo(device.lastSeen)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Scans:</span>
          <span className="ml-2 font-mono">{device.advertisementCount}</span>
        </div>
      </div>

      {device.uuids && device.uuids.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Service UUIDs</h4>
          <div className="flex flex-wrap gap-1">
            {device.uuids.map((u) => (
              <span key={u} className="text-xs font-mono px-2 py-1 rounded bg-blue-500/15 text-blue-400">{u}</span>
            ))}
          </div>
        </div>
      )}

      {device.advertisement?.raw && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Raw Advertising Data</h4>
          <div className="font-mono text-xs bg-black/30 p-3 rounded overflow-x-auto break-all">
            {formatHex(device.advertisement.raw)}
          </div>
        </div>
      )}

      {device.advertisement?.manufacturerData?.length!> 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Manufacturer Data</h4>
          <div className="space-y-2">
            {device.advertisement.manufacturerData.map((m, i) => (
              <div key={i} className="text-xs font-mono bg-black/30 p-2 rounded">
                <div className="text-emerald-400 font-medium">
                  {m.companyName || `ID 0x${m.companyId.toString(16).padStart(4, '0')}`}
                </div>
                <div className="text-muted-foreground">{m.data}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
