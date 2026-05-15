import { useScannerStore } from '@/stores/scannerStore';
import { Radio, Wifi, WifiOff, ScanMinus, Scan, Moon, Sun } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const { adapterState, isScanning, devices, scanStartedAt } = useScannerStore();
  const [darkMode, setDarkMode] = useState(true);

  const adapterOnline = adapterState === 'poweredOn';
  const adapterOffline = adapterState === 'poweredOff';

  const elapsed = scanStartedAt && isScanning
    ? Math.round((Date.now() - scanStartedAt) / 1000)
    : null;

  return (
    <header className="h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <Radio className="w-6 h-6 text-cyan-400" />
        <h1 className="text-lg font-bold text-white tracking-tight">BLE Scanner Pro</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
          <div className={`w-2 h-2 rounded-full ${adapterOnline ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]' : 'bg-red-500'}`} />
          <span className="text-xs text-slate-300">
            Adapter: {adapterOnline ? 'Online' : adapterOffline ? 'Offline' : '—'}
          </span>
        </div>

        {isScanning ? (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/50 border border-cyan-800/50">
            <Scan className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs text-cyan-300">Scanning{elapsed !== null ? ` (${elapsed}s)` : ''}</span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
            <ScanMinus className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs text-slate-500">Idle</span>
          </div>
        )}

        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
          <Wifi className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-300">{devices.length} devices</span>
        </div>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
