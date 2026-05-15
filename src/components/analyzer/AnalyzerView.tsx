'use client';

import { useMemo } from 'react';
import { parseAdStructure, AdField, formatHex } from '@/lib/ble-utils';
import { useScannerStore } from '@/stores/scannerStore';

export function AnalyzerView() {
  const { selectedDeviceId, devices } = useScannerStore();
  const device = useMemo(() => devices.find((d) => d.id === selectedDeviceId), [devices, selectedDeviceId]);

  return (
    <div className="h-full p-4 space-y-6">
      <h2 className="text-xl font-bold">Advertisement Data Analyzer</h2>

      {!device ? (
        <p className="text-muted-foreground">Select a device from the scanner view to analyze its advertising data.</p>
      ) : (
        <div className="space-y-6">
          {/* AD Structure */}
          <section className="border border-border rounded-lg p-4">
            <h3 className="font-semibold mb-3">AD Structure Parse</h3>
            {device.advertisement?.raw ? (
              <AdStructure hex={device.advertisement.raw} />
            ) : (
              <p className="text-muted-foreground text-sm">No raw advertising data available.</p>
            )}
          </section>

          {/* UUIDs */}
          {device.uuids && device.uuids.length > 0 && (
            <section className="border border-border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Service UUIDs</h3>
              <div className="flex flex-wrap gap-2">
                {device.uuids.map((u) => (
                  <span key={u} className="text-sm font-mono px-2 py-1 rounded bg-blue-500/15 text-blue-400">{u}</span>
                ))}
              </div>
            </section>
          )}

          {/* Manufacturer Data */}
          {device.advertisement?.manufacturerData?.length && (
            <section className="border border-border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Manufacturer Specific Data</h3>
              <div className="space-y-2">
                {device.advertisement.manufacturerData.map((m, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="text-muted-foreground w-28 shrink-0">Company {m.companyId}:</span>
                    <span className="text-emerald-400 font-medium">
                      {m.companyName || `ID 0x${m.companyId.toString(16).padStart(4, '0')}`}
                    </span>
                    <span className="font-mono text-muted-foreground">{m.data}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function AdStructure({ hex }: { hex: string }) {
  const fields = useMemo(() => parseAdStructure(hex), [hex]);
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="divide-y divide-border/50 rounded-lg overflow-hidden">
      {fields.map((f: AdField, i: number) => (
        <div key={i} className="hover:bg-slate-700/30">
          <button
            onClick={() => setExpanded(expanded === i ? null : String(i))}
            className="w-full text-left py-2 px-3 flex items-center gap-3 text-sm"
          >
            {f.type === 0xFF
              ? '🏭' : f.type <= 0x07 ? '🔔' : f.type <= 0x0D ? '📛' : '📦'
            }
            <span className="font-medium">{f.typeName}</span>
            <span className="font-mono text-muted-foreground text-xs">
              Len {f.length} · 0x{f.type.toString(16).padStart(2, '0')}
            </span>
          </button>
          {expanded === String(i) && (
            <div className="px-3 pb-2 ml-2 pl-5 text-xs font-mono space-y-1 border-l border-cyan-500/50">
              <div className="text-muted-foreground">
                <span className="text-slate-400">HEX:</span> {formatHex(f.hex)}
              </div>
              <div className="text-muted-foreground">
                <span className="text-slate-400">ASCII:</span>{" "}
                {Array.from(f.data).map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '·')).join('')}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const { useState } = require('react') as { useState: typeof useState };
