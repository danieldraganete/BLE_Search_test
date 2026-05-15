import { useState, useCallback, useRef, useEffect } from 'react';
import { GattCharacteristic } from '@/types/ble-types';
import { useGattStore } from '@/stores/gattStore';
import { formatHex, hexToBuf } from '@/lib/ble-utils';
import {
  Copy,
  ClipboardCheck,
  Send,
  Radio,
  RadioOff,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CharacteristicViewProps {
  characteristic: GattCharacteristic;
  serviceUuid: string;
}

export default function CharacteristicView({ characteristic, serviceUuid }: CharacteristicViewProps) {
  const [writeHex, setWriteHex] = useState('');
  const [writeSuccess, setWriteSuccess] = useState<boolean | null>(null);
  const [notificationLog, setNotificationLog] = useState<{ value: string; time: number }[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const { subscriptionHandles, subscribeCharacteristic, unsubscribeCharacteristic } = useGattStore();

  const isSubscribed = subscriptionHandles.has(characteristic.handle);
  const hasRead = characteristic.properties.includes('Read');
  const hasWrite = characteristic.properties.includes('Write') || characteristic.properties.includes('Write Without Response');
  const hasNotify = characteristic.properties.includes('Notify');
  const hasIndicate = characteristic.properties.includes('Indicate');

  const handleSubscribe = useCallback(() => {
    subscribeCharacteristic(characteristic.handle);
  }, [characteristic.handle, subscribeCharacteristic]);

  const handleUnsubscribe = useCallback(() => {
    unsubscribeCharacteristic(characteristic.handle);
  }, [characteristic.handle, unsubscribeCharacteristic]);

  const handleWrite = useCallback(async () => {
    try {
      const data = hexToBuf(writeHex);
      setWriteSuccess(true);
      if (logRef.current) {
        logRef.current.scrollTop = logRef.current.scrollHeight;
      }
    } catch {
      setWriteSuccess(false);
    }
  }, [writeHex]);

  const handleCopy = async () => {
    if (characteristic.valueHex) {
      await navigator.clipboard.writeText(characteristic.valueHex);
    }
  };

  return (
    <div className="mt-2 bg-slate-950/80 border border-slate-800 rounded-lg overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-800 flex items-center gap-3">
        <h4 className="text-xs font-semibold text-cyan-300">Characteristic</h4>
        <span className="text-xs font-mono text-amber-300">{characteristic.uuid}</span>
        <span className="text-[10px] text-slate-500 ml-auto">Service: {serviceUuid}</span>
      </div>

      <div className="p-3 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-slate-500">Handle: </span>
            <span className="font-mono text-slate-300">#{characteristic.handle}</span>
          </div>
          <div>
            <span className="text-slate-500">Value Handle: </span>
            <span className="font-mono text-slate-300">#{characteristic.valueHandle}</span>
          </div>
          <div>
            <span className="text-slate-500">Properties: </span>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {characteristic.properties.map((p) => (
                <span key={p} className="px-1.5 py-0.5 rounded bg-cyan-950/50 border border-cyan-900/50 text-cyan-400 text-[10px]">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        {characteristic.valueHex && (
          <div>
            <div className="text-xs text-slate-500 mb-1">Current Value</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-amber-300 bg-slate-900 px-2 py-1.5 rounded border border-slate-800 break-all">
                {formatHex(characteristic.valueHex)}
              </code>
              <button onClick={handleCopy} className="text-slate-500 hover:text-slate-300">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-[10px] text-slate-600 mt-1">
              ASCII: {Array.from(hexToBuf(characteristic.valueHex))
                .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
                .join('')}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {hasNotify || hasIndicate ? (
            isSubscribed ? (
              <button
                onClick={handleUnsubscribe}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
              >
                <RadioOff className="w-3 h-3" />
                Unsubscribe
              </button>
            ) : (
              <button
                onClick={handleSubscribe}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
              >
                <Radio className="w-3 h-3" />
                Subscribe
              </button>
            )
          ) : null}

          {hasWrite && (
            <button
              onClick={handleWrite}
              disabled={!writeHex}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors disabled:opacity-40"
            >
              <Send className="w-3 h-3" />
              Write
            </button>
          )}
        </div>

        {hasWrite && (
          <div>
            <input
              type="text"
              value={writeHex}
              onChange={(e) => setWriteHex(e.target.value)}
              placeholder="Enter hex data..."
              className="w-full text-xs font-mono bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-amber-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
            />
            {writeSuccess !== null && (
              <div className={`text-xs mt-1 flex items-center gap-1 ${writeSuccess ? 'text-emerald-400' : 'text-red-400'}`}>
                <AlertCircle className="w-3 h-3" />
                {writeSuccess ? 'Write successful' : 'Write failed'}
              </div>
            )}
          </div>
        )}

        {(isSubscribed) && (
          <div>
            <div className="text-xs text-slate-500 mb-1">Notification Log</div>
            <div
              ref={logRef}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 max-h-[160px] overflow-y-auto space-y-1"
            >
              {notificationLog.length === 0 ? (
                <div className="text-xs text-slate-600 italic">Waiting for notifications...</div>
              ) : (
                notificationLog.map((entry, i) => (
                  <div key={i} className="flex gap-2 text-[10px]">
                    <span className="text-slate-600 shrink-0">[{new Date(entry.time).toLocaleTimeString()}]</span>
                    <span className="font-mono text-emerald-300">{formatHex(entry.value)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {characteristic.descriptors.length > 0 && (
          <div>
            <div className="text-xs text-slate-500 mb-1">Descriptors</div>
            <div className="space-y-1">
              {characteristic.descriptors.map((desc) => (
                <div key={desc.handle} className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-violet-400">{desc.uuid}</span>
                  <span className="text-slate-600">#</span>
                  <span className="font-mono text-slate-400">{desc.handle}</span>
                  {desc.valueHex && <span className="font-mono text-amber-300">{formatHex(desc.valueHex)}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
