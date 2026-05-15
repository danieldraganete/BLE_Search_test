import { useMemo, useState } from 'react';
import { Advertisement, ManufacturerData } from '@/types/ble-types';
import { formatHex, bufToHex, hexToBuf } from '@/lib/ble-utils';
import { Factory, ChevronDown, ChevronRight, Copy, ClipboardCheck } from 'lucide-react';

const KNOWN_COMPANIES: Record<number, string> = {
  0x0000: 'Ericsson Technology Licensing',
  0x0001: 'Nokia',
  0x0002: 'Tiano',
  0x0004: 'Broadcom',
  0x0007: 'Infineon',
  0x0008: 'Microsoft',
  0x000D: 'Qualcomm',
  0x0015: 'Samsung',
  0x001E: 'Apple',
  0x002F: 'Codegate Labs',
  0x004D: 'Silicon Labs',
  0x005F: 'STMicroelectronics',
  0x0075: 'NXP Semiconductors',
  0x0079: 'Maxim Integrated',
  0x008C: 'TI (Texas Instruments)',
  0x0098: 'Nordic Semiconductor',
  0x00AC: 'Allegro Microsystems',
  0x00B9: 'Espressif',
  0x0104: 'Realtek',
  0x0125: 'MediaTek',
  0x0169: 'Govee Life',
  0x02B7: 'Sonos',
  0x02E2: 'DJI',
  0x02E8: 'Bose',
  0x02F5: 'Xiaomi',
  0x0327: 'IKEA',
  0x0471: 'Fitbit',
  0x05C5: 'Google',
  0x0701: 'GoPro',
  0x07DE: 'Dynamix',
  0x0925: 'Apple (iBeacon)',
  0x0929: 'Apple (Eddystone/Accessory)',
  0x0AAF: 'Apple (Continuity)',
  0x0CF0: 'Anker Innovations',
  0x0D5E: 'Ring',
  0x1040: 'Sony Corporation',
};

function getCompanyName(id: number): string {
  return KNOWN_COMPANIES[id] ?? `Unknown (0x${id.toString(16).toUpperCase()})`;
}

interface ManufacturerPanelProps {
  advertisement: Advertisement | null;
}

function MfrDataRow({ mfr }: { mfr: ManufacturerData }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const companyId = mfr.companyId;
  const companyName = getCompanyName(companyId);

  const companyColor = mfr.companyName || companyName.includes('Unknown')
    ? 'text-slate-400'
    : 'text-cyan-300';

  const payloadBytes = hexToBuf(mfr.data);
  const byteLabels = Array.from(payloadBytes).map((b) => {
    if (b >= 0x30 && b <= 0x39) return 'text-cyan-400';
    if (b >= 0x41 && b <= 0x5A) return 'text-emerald-400';
    if (b >= 0x61 && b <= 0x7A) return 'text-emerald-400';
    return 'text-amber-300';
  });

  const handleCopy = async () => {
    const text = `Company: ${companyName}\nID: 0x${companyId.toString(16).toUpperCase()}\nData: ${formatHex(mfr.data)}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/5 transition-colors"
      >
        {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400`}>
              0x{companyId.toString(16).toUpperCase().padStart(4, '0')}
            </span>
            <span className={`text-sm font-medium ${companyColor}`}>{companyName}</span>
          </div>
          <div className="text-xs text-slate-500 font-mono mt-1">
            {mfr.type} — {formatHex(mfr.data)}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-3 space-y-3 border-t border-slate-800 pt-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500">Company ID: </span>
              <span className="font-mono text-amber-300">0x{companyId.toString(16).toUpperCase()}</span>
            </div>
            <div>
              <span className="text-slate-500">Type: </span>
              <span className="font-mono text-slate-300">{mfr.type}</span>
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-500">Hex payload:</span>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-xs font-mono text-amber-300 bg-slate-900 px-2 py-1 rounded">
                {formatHex(mfr.data)}
              </code>
              <button onClick={handleCopy} className="shrink-0">
                {copied ? (
                  <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />
                )}
              </button>
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-500">Byte breakdown:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {payloadBytes.map((byte, i) => (
                <span
                  key={i}
                  className={`text-xs font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 ${byteLabels[i]}`}
                >
                  {byte.toString(16).padStart(2, '0').toUpperCase()}
                </span>
              ))}
              {payloadBytes.length === 0 && <span className="text-xs text-slate-600 italic">empty</span>}
            </div>
          </div>

          {payloadBytes.length > 0 && (
            <div>
              <span className="text-xs text-slate-500">ASCII:</span>
              <span className="text-xs font-mono text-slate-300 ml-2">
                {Array.from(payloadBytes).map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.')).join('') || '(binary)'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ManufacturerPanel({ advertisement }: ManufacturerPanelProps) {
  const mfrData = useMemo(
    () => (advertisement ? advertisement.manufacturerData.filter((m) => m.data.length > 0) : []),
    [advertisement]
  );

  if (!advertisement || mfrData.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Factory className="w-4 h-4 text-rose-400" />
          Manufacturer Data
        </h3>
        <div className="text-sm text-slate-500 italic py-2">
          {!advertisement ? 'No device selected' : 'No manufacturer data in advertisement'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
        <Factory className="w-4 h-4 text-rose-400" />
        Manufacturer Data ({mfrData.length})
      </h3>
      <div className="space-y-2">
        {mfrData.map((mfr, i) => (
          <MfrDataRow key={`${mfr.companyId}-${i}`} mfr={mfr} />
        ))}
      </div>
    </div>
  );
}
