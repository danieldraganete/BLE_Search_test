import { useState } from 'react';
import { parseAdStructure, formatHex, decodeFlags, adTypeToString, AdField } from '@/lib/ble-utils';
import { ChevronDown, ChevronRight, Info, Eye, EyeOff } from 'lucide-react';

interface AdStructureViewProps {
  rawHex: string;
  title?: string;
}

const typeColorMap: Record<number, string> = {
  0x01: 'bg-emerald-500/20 text-emerald-400',
  0x08: 'bg-sky-500/20 text-sky-400',
  0x09: 'bg-sky-500/20 text-sky-400',
  0x0A: 'bg-amber-500/20 text-amber-400',
  0x0F: 'bg-violet-500/20 text-violet-400',
  0x16: 'bg-orange-500/20 text-orange-400',
  0x19: 'bg-fuchsia-500/20 text-fuchsia-400',
  0xFF: 'bg-rose-500/20 text-rose-400',
};

const typeBgMap: Record<number, string> = {
  0x01: 'border-emerald-500/40',
  0x08: 'border-sky-500/40',
  0x09: 'border-sky-500/40',
  0x0A: 'border-amber-500/40',
  0x0F: 'border-violet-500/40',
  0x16: 'border-orange-500/40',
  0x19: 'border-fuchsia-500/40',
  0xFF: 'border-rose-500/40',
};

function AdFieldRow({ field }: { field: AdField }) {
  const [expanded, setExpanded] = useState(false);
  const colorClass = typeColorMap[field.type] || 'bg-slate-500/20 text-slate-400';
  const borderClass = typeBgMap[field.type] || 'border-slate-500/40';

  const isFlags = field.type === 0x01;
  const isName = field.type === 0x09 || field.type === 0x08;
  const isTxPower = field.type === 0x0A;
  const isMfr = field.type === 0xFF;

  let decodedPreview = '';
  if (isName) {
    decodedPreview = field.ascii;
  } else if (isTxPower) {
    decodedPreview = `${parseInt(field.hex, 16) - 256} dBm`;
  } else if (isMfr) {
    const companyId = parseInt(field.hex.substring(0, 4), 16);
    decodedPreview = `Company ID: 0x${companyId.toString(16).toUpperCase()}`;
  }

  return (
    <div className={`border-l-2 ${borderClass} mb-2 rounded-r-lg`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
      >
        {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
        <span className={`text-xs font-mono px-2 py-0.5 rounded ${colorClass}`}>
          0x{field.type.toString(16).toUpperCase()}
        </span>
        <span className="text-sm text-slate-300">{field.typeName}</span>
        <span className="text-xs text-slate-500 ml-auto">LEN:{field.length}</span>
      </button>

      {decodedPreview && !expanded && (
        <div className="px-9 pb-2 text-xs text-slate-400">
          {decodedPreview ? decodedPreview : <span className="text-slate-600">—</span>}
        </div>
      )}

      {expanded && (
        <div className="px-9 pb-3 space-y-2">
          <div className="flex gap-4 text-xs">
            <div>
              <span className="text-slate-500">Hex:</span>{' '}
              <span className="font-mono text-amber-300">{formatHex(field.hex)}</span>
            </div>
          </div>

          <div>
            <span className="text-slate-500 text-xs">ASCII: </span>
            <span className="font-mono text-xs text-slate-300">
              {field.ascii || <span className="text-slate-600">(empty)</span>}
            </span>
          </div>

          {isFlags && (
            <div className="space-y-1">
              <span className="text-xs text-violet-400 font-medium">Flags:</span>
              <div className="flex flex-wrap gap-1 ml-2">
                {decodeFlags(field.hex).map((flag) => (
                  <span key={flag} className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {isMfr && (
            <div className="space-y-1">
              <span className="text-xs text-rose-400 font-medium">Company ID:</span>{' '}
              <span className="font-mono text-sm text-rose-300">
                0x{field.hex.substring(0, 4).toUpperCase()}
              </span>
              <div className="text-xs text-slate-400">
                Payload: <span className="font-mono">{formatHex(field.hex.substring(4))}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdStructureView({ rawHex, title = 'AD Structure' }: AdStructureViewProps) {
  const [showRaw, setShowRaw] = useState(false);
  const fields = parseAdStructure(rawHex);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400" />
          {title}
        </h3>
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="text-xs flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
        >
          {showRaw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showRaw ? 'Hide RAW' : 'Show RAW'}
        </button>
      </div>

      {showRaw && (
        <div className="bg-slate-950/50 rounded-lg px-3 py-2 font-mono text-xs text-amber-300 break-all border border-slate-800">
          {rawHex}
        </div>
      )}

      {fields.length === 0 ? (
        <div className="text-sm text-slate-500 italic">No AD data to parse</div>
      ) : (
        <div>
          {fields.map((field, i) => (
            <AdFieldRow key={`${field.type}-${i}`} field={field} />
          ))}
        </div>
      )}
    </div>
  );
}
