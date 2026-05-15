'use client';

import { useCallback, useMemo } from 'react';
import { Star, ChevronUp, ChevronDown, ChevronUpDown, Bluetooth, Clock, Layers } from 'lucide-react';
import { useScannerStore } from '@/stores/scannerStore';
import { filterDevices, sortDevices } from '@/lib/filters';
import { formatAddress, formatTimeAgo, rssiToBars, rssiString } from '@/lib/ble-utils';
import type { SortColumn, SortDirection } from '@/lib/filters';

function RssiBars({ rssi }: { rssi: number }) {
  const bars = rssiToBars(rssi);
  const color = rssi >= -55 ? 'bg-emerald-500' : rssi >= -65 ? 'bg-yellow-500' : rssi >= -75 ? 'bg-orange-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-xs font-medium tabular-nums">{rssi}</span>
      <span className="text-xs text-slate-400">dBm</span>
      <div className="flex items-end gap-0.5 h-4 ml-2">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`w-1.5 rounded-sm transition-colors ${
              level <= bars ? color : 'bg-slate-200'
            }`}
            style={{ height: `${level * 5 + 2}px` }}
          />
        ))}
      </div>
      <span className="text-xs ml-1 px-1.5 py-0.5 rounded-full text-xs font-medium"
        style={{
          backgroundColor: rssi >= -55 ? '#f0fdf4' : rssi >= -65 ? '#fefce7' : rssi >= -75 ? '#fff7ed' : '#fef2f2',
          color: rssi >= -55 ? '#16a34a' : rssi >= -65 ? '#ca8a04' : rssi >= -75 ? '#ea580c' : '#dc2626',
        }}
      >
        {rssiString(rssi)}
      </span>
    </div>
  );
}

const columns: Array<{ key: SortColumn; label: string }> = [
  { key: 'name', label: 'Name' },
  { key: 'rssi', label: 'RSSI' },
  { key: 'address', label: 'Address' },
  { key: 'adCount', label: 'Scans' },
  { key: 'lastSeen', label: 'Last Seen' },
];

export function DeviceTable() {
  const {
    devices,
    filters,
    sortColumn,
    sortDirection,
    selectedDeviceId,
    setSortColumn,
    toggleSortDirection,
    setSelectedDevice,
    toggleFavorite,
  } = useScannerStore();

  const displayedDevices = useMemo(() => {
    const filtered = filterDevices(devices, filters);
    return sortDevices(filtered, sortColumn, sortDirection);
  }, [devices, filters, sortColumn, sortDirection]);

  const handleSort = useCallback(
    (column: SortColumn) => {
      if (sortColumn === column) {
        toggleSortDirection();
      } else {
        setSortColumn(column);
        if (column === 'rssi' || column === 'adCount') {
          useScannerStore.setState({ sortDirection: 'desc' });
        }
      }
    },
    [sortColumn, toggleSortDirection, setSortColumn]
  );

  const handleRowClick = useCallback((deviceId: string) => {
    setSelectedDeviceId === deviceId ? setSelectedDevice(null) : setSelectedDevice(deviceId);
  }, [setSelectedDevice, selectedDeviceId]);

  const handleToggleFavorite = useCallback((e: React.MouseEvent, deviceId: string) => {
    e.stopPropagation();
    toggleFavorite(deviceId);
  }, [toggleFavorite]);

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return <ChevronUpDown className="w-3 h-3 text-slate-300" />;
    return sortDirection === 'asc'
      ? <ChevronUp className="w-3 h-3 text-slate-500" />
      : <ChevronDown className="w-3 h-3 text-slate-500" />;
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 sticky top-0">
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 w-10"></th>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className="px-3 py-2 text-left text-xs font-semibold text-slate-500 cursor-pointer hover:bg-slate-100 select-none transition-colors"
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  <SortIcon column={col.key} />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayedDevices.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-3 py-12 text-center text-slate-400">
                <div className="flex flex-col items-center gap-2">
                  <Bluetooth className="w-10 h-10 text-slate-300" />
                  <p>No devices found</p>
                  <p className="text-xs">Start a scan to discover BLE devices</p>
                </div>
              </td>
            </tr>
          ) : (
            displayedDevices.map((device) => {
              const isSelected = selectedDeviceId === device.id;
              return (
                <tr
                  key={device.id}
                  onClick={() => handleRowClick(device.id)}
                  className={`
                    cursor-pointer transition-colors border-b border-slate-100
                    ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}
                  `}
                >
                  <td className="px-3 py-2.5 text-center" onClick={(e) => { e.stopPropagation(); }}>
                    <button
                      onClick={(e) => handleToggleFavorite(e, device.id)}
                      className={`p-1 rounded transition-colors ${
                        device.isFavorite ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'
                      }`}
                    >
                      <Star className="w-4 h-4" fill={device.isFavorite ? 'currentColor' : 'none'} />
                    </button>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${device.connectable ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span className="font-medium text-slate-800 truncate max-w-[180px]">
                        {device.name || <span className="text-slate-400 italic">&lt;no name&gt;</span>}
                      </span>
                    </div>
                    {device.uuids && device.uuids.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {device.uuids.slice(0, 3).map((u, i) => (
                          <span key={i} className="px-1.5 py-0.5 text-[10px] rounded font-mono bg-slate-100 text-slate-500">
                            {u}
                          </span>
                        ))}
                        {device.uuids.length > 3 && (
                          <span className="px-1 py-0.5 text-[10px] rounded font-mono bg-slate-100 text-slate-500">
                            +{device.uuids.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <RssiBars rssi={device.rssi} />
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-xs text-slate-600">{formatAddress(device.address)}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1 text-slate-600">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono text-xs tabular-nums">{device.advertisementCount}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs">{formatTimeAgo(device.lastSeen)}</span>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {displayedDevices.length > 0 && (
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between shrink-0">
          <span>{displayedDevices.length} device{displayedDevices.length !== 1 ? 's' : ''}{' '}
            {displayedDevices.length !== devices.length
              ? `(filtered from ${devices.length})`
              : ''}
          </span>
        </div>
      )}
    </div>
  );
}
