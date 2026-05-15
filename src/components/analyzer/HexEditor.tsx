import { useState, useCallback } from 'react';
import { hexToBuf, formatHex } from '@/lib/ble-utils';
import { Copy, ClipboardCheck } from 'lucide-react';

interface HexEditorProps {
  hexData: string;
  title?: string;
  byteLabels?: boolean;
}

function getByteColor(byte: number): string {
  if (byte >= 0x30 && byte <= 0x39) return 'text-cyan-400';
  if (byte >= 0x41 && byte <= 0x5A) return 'text-emerald-400';
  if (byte >= 0x61 && byte <= 0x7A) return 'text-emerald-400';
  if (byte === 0) return 'text-slate-600';
  if (byte === 0xff) return 'text-rose-400';
  return 'text-slate-300';
}

function getByteBg(byte: number): string {
  if (byte === 0) return 'bg-slate-800/50';
  if (byte === 0xff) return 'bg-rose-900/30';
  return '';
}

export default function HexEditor({ hexData, title = 'Hex Editor', byteLabels = false }: HexEditorProps) {
  const [copied, setCopied] = useState(false);
  const [highlightAddress, setHighlightAddress] = useState<string | null>(null);

  const bytes = hexToBuf(hexData);
  const bytesPerRow = 16;

  const handleCopy = useCallback(async () => {
    const plain = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join(' ');
    await navigator.clipboard.writeText(plain);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [bytes]);

  const rows: number[][] = [];
  for (let i = 0; i < bytes.length; i += bytesPerRow) {
    const row: number[] = [];
    for (let j = 0; j < bytesPerRow; j++) {
      if (i + j < bytes.length) row.push(bytes[i + j]);
    }
    rows.push(row);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        <button
          onClick={handleCopy}
          className="text-xs flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
        >
          {copied ? <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <div className="bg-slate-950/80 rounded-lg border border-slate-800 overflow-auto max-h-[400px]">
        <div className="flex border-b border-slate-800">
          <div className="w-24 shrink-0 px-2 py-1 text-[10px] font-mono text-slate-600 text-right bg-slate-900/50">
            Offset
          </div>
          <div className="flex-1 px-2 py-1 text-[10px] font-mono text-slate-600 bg-slate-900/50">
            HEX
          </div>
          <div className="w-48 shrink-0 px-2 py-1 text-[10px] font-mono text-slate-600 border-l border-slate-800 bg-slate-900/50">
            ASCII
          </div>
        </div>

        {rows.length === 0 && (
          <div className="px-4 py-6 text-sm text-slate-500 text-center italic">No data to display</div>
        )}

        {rows.map((row, rowIndex) => {
          const offset = rowIndex * bytesPerRow;
          const addr = offset.toString(16).padStart(4, '0').toUpperCase();
          const asciiChars = row.map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'));

          return (
            <div
              key={rowIndex}
              className="flex hover:bg-white/5 transition-colors cursor-default"
              onMouseEnter={() => setHighlightAddress(addr)}
              onMouseLeave={() => setHighlightAddress(null)}
            >
              <div
                className={`w-24 shrink-0 px-2 py-0.5 text-xs font-mono text-right ${highlightAddress === addr
                  ? 'text-cyan-400 font-bold'
                  : 'text-slate-500'
                  } bg-slate-950/30`}
              >
                {addr}
              </div>
              <div className="flex-1 flex">
                {row.map((byte, col) => (
                  <div
                    key={col}
                    className={`w-6 text-center text-xs font-mono py-0.5 transition-colors ${getByteColor(byte)} ${getByteBg(byte)
                      } ${byteLabels ? 'underline decoration-dotted' : ''}`}
                  >
                    {byte.toString(16).padStart(2, '0')}
                  </div>
                ))}
                {Array.from({ length: bytesPerRow - row.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="w-6" />
                ))}
              </div>
              <div className="w-48 shrink-0 px-2 py-0.5 text-xs font-mono text-slate-400 border-l border-slate-800">
                {asciiChars.join('')}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-slate-500 flex items-center gap-3">
        <span>{bytes.length} bytes</span>
        <span>{rows.length} rows</span>
      </div>
    </div>
  );
}
