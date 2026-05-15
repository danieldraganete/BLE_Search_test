'use client';

import { useState, useCallback, useMemo } from 'react';
import { Search, Filter, X, Star, Radio, RadioTower, Clock, Layers, Star as StarIcon } from 'lucide-react';
import { useScannerStore } from '@/stores/scannerStore';
import { formatAddress, rssiToBars, rssiString, formatTimeAgo } from '@/lib/ble-utils';
import { filterDevices, sortDevices, FilterState, SortColumn, SortDirection } from '@/lib/filters';
import { parseAdStructure, formatHex, decodeFlags, adTypeToString, AdField } from '@/lib/ble-utils';
import { useElectron } from '@/hooks/useElectron';

/* ─── Signal bars ─── */
function RssiBars({ rssi }: { rssi: number }) {
  const bars = rssiToBars(rssi);
  const color =
    rssi >= -55 ? 'bg-emerald-500'
    : rssi >= -65 ? 'bg-yellow-500'
    : rssi >= -75 ? 'bg-orange-500'
    : 'bg-red-500';
  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-xs font-medium tabular-nums">{rssi}</span>
      <span className="text-[10px] text-slate-400">dBm</span>
      <div className="flex items-end gap-[2px] h-4 ml-1.5">
        {[1, 2, 3, 4].map((l) => (
          <div
            key={l}
            className={`w-1.5 rounded-sm transition-colors ${l <= bars ? color : 'bg-slate-200'}`}
            style={{ height: (l + 3) * 4 }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Scan Controls ─── */
function ScanControls() {
  const {
    isScanning, setIsScanning, scanStartedAt, setScanStartedAt,
    devices, setError, adapterState,
  } = useScannerStore();
  const { isElectron } = useElectron();
  const [duration, setDuration] = useState(0);
  const intervalRef = useState(() => null)[1];

  const handleStartScan = useCallback(async () => {
    if (!isElectron) { setError('Not running in Electron'); return; }
    try {
      if (!window.electronAPI) return;
      await window.electronAPI.startScan(acceptAll?: true);
      setIsScanning(true);
      setScanStartedAt(Date.now());
      setError(null);
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  }, [isElectron, setIsScanning, setScanStartedAt, setError]);

  const handleStopScan = useCallback(async () => {
    if (!isElectron) return;
    try {
      if (!window.electronAPI) return;
      await window.electronAPI.stopScan();
      setIsScanning(false);
      setScanStartedAt(null);
    } catch {/* ignore */}
  }, [isElectron, setIsScanning, setScanStartedAt]);

  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-white border-b border-slate-200">
      <button
        onClick={isScanning ? handleStopScan : handleStartScan}
        disabled={adapterState === 'poweredOff' || adapterState === 'unknown'}
        className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-sm transition-all
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isScanning ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-200'
            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200'}`}
      >
        {isScanning ? ('Stop Scan') : ('Start Scan')}
      </button>

      <div className="flex items-center gap-4 ml-auto text-sm text-slate-600">
        {isScanning && <Radio className="w-4 h-4 animate-pulse text-blue-500" />}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Duration</span>
          <span className="font-mono font-medium text-slate-800 tabular-nums">{duration} s</span>
        </div>
        <div className="h-5 w-px bg-slate-200" />
        <div className="flex items-center gap-1.5">
          <RadioTower className="w-4 h-4 text-slate-400" />
          <span className="text-slate-400">Devices</span>
          <span className="inline-flex items-center justify-center min-w-[2ch] px-1.5 py-0.5 text-xs font-bold rounded-full font-mono bg-slate-100 text-slate-800">
            {devices.length}
          </span>
        </div>
        <div
          className="ml-2 px-2 py-0.5 text-xs rounded-full border font-medium"
          style={{
            borderColor: adapterState === 'poweredOn' ? '#f0fdf4' : (adapterState === 'poweredOff' ? '#fef2f2' : '#f3f4f6'),
            color: adapterState === 'poweredOn' ? '#16a34a' : (adapterState === 'poweredOff' ? '#dc2626' : '#6b7280'),
            backgroundColor: adapterState === 'poweredOn' ? '#f0fdf4' : (adapterState === 'poweredOff' ? '#fef2f2' : '#f3f4f6'),
          }}
        >
          {adapterState === 'poweredOn' ? 'Powered On'
            : (adapterState === 'poweredOff' ? 'Powered Off' : 'Unknown')}
        </div>
      </div>
    </div>
  );
}

/* ─── Filter Bar ─── */
function FilterBar() {
  const { filters, setFilters } = useScannerStore();
  const hasFilters =
    filters.nameFilter.length > 0 || filters.uuidFilter.length > 0 ||
    filters.addressFilter.length > 0 || filters.showFavoritesOnly;

  return (
    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">
          <Filter className="w-3.5 h-3.5" /> Filters
        </span>
        <div className="flex items-center gap-1.5 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input type="text" placeholder="Name" value={filters.nameFilter}
            onChange={(e) => setFilters({ nameFilter: e.target.value })}
            className="pl-8 w-28 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input type="text" placeholder="UUID" value={filters.uuidFilter}
            onChange={(e) => setFilters({ uuidFilter: e.target.value })}
            className="pl-8 w-24 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
        </div>
        <input type="text" placeholder="Address" value={filters.addressFilter}
          onChange={(e) => setFilters({ addressFilter: e.target.value })}
          className="w-28 text-sm border border-slate-200 rounded-lg bg-white px-2 py-1.5 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm cursor-pointer border border-slate-200 bg-white hover:border-slate-300
            transition-all select-none showFavoritesOnly ? 'bg-amber-50 border-amber-200 text-amber-700' : ''}>
            <input type="checkbox" checked={filters.showFavoritesOnly}
              onChange={(e) => setFilters({ showFavoritesOnly: e.target.checked })} className="sr-only" />
            <Star className="w-3.5 h-3.5" fill={filters.showFavoritesOnly ? 'currentColor' : 'none'} />
            Favorites
          </label>
        </div>
        {hasFilters && (
          <button onClick={() => setFilters({
            nameFilter: '', uuidFilter: '', addressFilter: '',
            minRssi: null, maxRssi: null, connectable: 'all', showFavoritesOnly: false,
          })}
            className="ml-auto text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 px-2 py-1 rounded-md hover:bg-red-50 transition-colors">
            <X className="w-3 h-3" /> Clear All
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Device Table ─── */
function DeviceTable() {
  const {
    devices, filters, sortColumn, sortDirection,
    selectedDeviceId, setSelectedDevice, setSortColumn,
    toggleSortDirection, toggleFavorite,
  } = useScannerStore();

  const displayedDevices = useMemo(() => {
    const filtered = filterDevices(devices, filters);
    return sortDevices(filtered, sortColumn, sortDirection);
  }, [devices, filters, sortColumn, sortDirection]);

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 sticky top-0">
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500"></th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Name</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">RSSI</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Address</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Scans</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Last Seen</th>
          </tr>
        </thead>
        <tbody>
          {displayedDevices.length === 0 ? (
            <tr><td colSpan={6} className="px-3 py-20 text-center text-slate-400">
              No devices — Start a scan</td></tr>
          ) : (
            displayedDevices.map((device) => {
              const isSelected = selectedDeviceId === device.id;
              return (
                <tr
                  key={device.id}
                  onClick={() => setSelectedDevice(isSelected ? null : device.id)}
                  className={`cursor-pointer transition-colors border-b border-slate-100 ${
                    isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                >
                  <td className="px-3 py-2.5 text-center">
                    <button onClick={(e) => { e.stopPropagation(); toggleFavorite(device.id); }}
                      className={`p-1 rounded transition-colors ${device.isFavorite ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'}`}>
                      <StarIcon className="w-4 h-4" fill={device.isFavorite ? 'currentColor' : 'none'} />
                    </button>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${device.connectable ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span className="font-medium text-slate-800 truncate max-w-[160px]">
                        {device.name || <span className="text-slate-400 italic">{device.address}</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5"><RssiBars rssi={device.rssi} /></td>
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-xs text-slate-600">{formatAddress(device.address)}</span>
                  </td>
                  <td className="px-3 py-2.5 text-sm font-mono text-slate-600">{device.advertisementCount}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{formatTimeAgo(device.lastSeen)}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      {displayedDevices.length > 0 && (
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
          {displayedDevices.length} device{displayedDevices.length !== 1 ? 's' : ''}{' '}
          {displayedDevices.length !== devices.length ? `(from ${devices.length})` : ''}
        </div>
      )}
    </div>
  );
}

/* ─── Device Detail Panel ─── */
function DeviceDetailPanel() {
  const { selectedDeviceId, devices, toggleFavorite } = useScannerStore();
  const device = devices.find((d) => d.id === selectedDeviceId);

  if (!device) return null;

  return (
    <div className="w-80 border-l border-slate-200 p-4 overflow-auto bg-white space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">{device.name || device.address}</h3>
        <button onClick={() => toggleFavorite(device.id)}>
          <StarIcon className="w-4 h-4 text-amber-500" fill="currentColor" />
        </button>
      </div>
      <div className="space-y-2 text-sm">
        <div><span className="text-slate-400">Address:</span> <span className="font-mono">{formatAddress(device.address)}</span></div>
        <div><span className="text-slate-400">RSSI:</span> <span className="font-mono text-emerald-600">{device.rssi} dBm</span></div>
        <div><span className="text-slate-400">Connect:</span> <span>{device.connectable ? 'Yes' : 'No'}</span></div>
        <div><span className="text-slate-400">Seen:</span> <span>{formatTimeAgo(device.lastSeen)}</span></div>
        <div><span className="text-slate-400">Scans:</span> <span>{device.advertisementCount}</span></div>
      </div>
      {device?.uuids?.length && (
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Services</h4>
          <div className="flex flex-wrap gap-1">
            {device.uuids.map((u) => (
              <span key={u} className="text-xs font-mono px-2 py-1 rounded bg-blue-50 text-blue-600">{u}</span>
            ))}
          </div>
        </div>
      )}
      {device?.raw && (
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Raw Data</h4>
          <div className="font-mono text-xs bg-slate-50 border border-slate-200 p-3 rounded text-slate-600">
            {formatHex(device.advertisement?.raw)}
          </div>
        </div>
      )}
    </div>
  );
}

export function ScannerView() {
  return (
    <div className="h-full flex flex-col">
      <ScanControls />
      <FilterBar />
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto">
          <DeviceTable />
        </div>
        {/* <DeviceDetailPanel /> */}
      </div>
    </div>
  );
}
