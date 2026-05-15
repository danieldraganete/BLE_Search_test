import { useState } from 'react';
import { useGattStore } from '@/stores/gattStore';
import { useScannerStore } from '@/stores/scannerStore';
import { GattService, GattCharacteristic } from '@/types/ble-types';
import {
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Folder,
  FileText,
  BluetoothConnected,
  Bluetooth,
  ScanLine,
  ArrowDownToLine,
  ArrowUpToLine,
  Activity,
  Send,
  Eye,
} from 'lucide-react';
import CharacteristicView from './CharacteristicView';

const PROPERTY_ICONS: Record<string, { icon: typeof Eye; color: string }> = {
  Read: { icon: ScanLine, color: 'text-blue-400' },
  Write: { icon: Send, color: 'text-amber-400' },
  'Write Without Response': { icon: Send, color: 'text-amber-300' },
  Notify: { icon: Activity, color: 'text-emerald-400' },
  Indicate: { icon: Activity, color: 'text-violet-400' },
};

function CharRow({ char }: { char: GattCharacteristic }) {
  const [expanded, setExpanded] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const { subscriptionHandles, subscribeCharacteristic, unsubscribeCharacteristic } = useGattStore();
  const isSubscribed = subscriptionHandles.has(char.handle);

  const propIcons = char.properties.map((p) => {
    const prop = PROPERTY_ICONS[p];
    if (!prop) return null;
    const Icon = prop.icon;
    return (
      <span key={p} className={`${prop.color}`}>
        <Icon className="w-3 h-3" />
      </span>
    );
  });

  return (
    <>
      <div className="flex-col">
        <div className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-500" />}
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-mono text-slate-300">{char.uuid}</span>
          <div className="flex gap-1">{propIcons}</div>
          {isSubscribed && <span className="text-[10px] text-emerald-400 font-medium ml-1">Ntf</span>}
          <span className="ml-auto text-[10px] text-slate-600">#{char.handle}</span>
        </div>

        {expanded && (
          <div className="flex items-center gap-1 pl-8 pr-3 py-1">
            <span className="text-[10px] text-slate-500">Properties:</span>
            <div className="flex flex-wrap gap-1">
              {char.properties.map((p) => (
                <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {p}
                </span>
              ))}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setShowDetail(!showDetail); }}
              className="ml-auto text-[10px] text-cyan-400 hover:text-cyan-300"
            >
              Details
            </button>
          </div>
        )}

        {showDetail && <CharacteristicView characteristic={char} serviceUuid={char.uuid} />}
      </div>
    </>
  );
}

function ServiceRow({ service }: { service: GattService }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-slate-800 rounded-lg overflow-hidden mb-2 bg-slate-950/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors text-left"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-cyan-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-500" />
        )}
        {expanded ? (
          <FolderOpen className="w-4 h-4 text-cyan-400" />
        ) : (
          <Folder className="w-4 h-4 text-slate-500" />
        )}
        <span className="text-sm font-mono text-slate-200">{service.uuid}</span>
        <span className="text-xs text-slate-500 ml-auto">#{service.handle}</span>
      </button>

      {expanded && (
        <div className="pb-2 bg-slate-900/30">
          {service.characteristics.length === 0 ? (
            <div className="px-8 py-1 text-xs text-slate-600 italic">No characteristics</div>
          ) : (
            service.characteristics.map((char) => <CharRow key={char.uuid + char.handle} char={char} />)
          )}
        </div>
      )}
    </div>
  );
}

export default function GattExplorer() {
  const { services, connected, connecting, connectedDeviceId, setConnected, setConnecting, setConnectedDeviceId } = useGattStore();
  const { selectedDeviceId } = useScannerStore();

  const handleConnect = () => {
    if (connected) {
      setConnected(false);
      setConnectedDeviceId(null);
    } else if (selectedDeviceId) {
      setConnecting(true);
      setTimeout(() => {
        setConnecting(false);
        setConnected(true);
        setConnectedDeviceId(selectedDeviceId);
      }, 1500);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
          <DatabaseIcon className="w-5 h-5 text-cyan-400" />
          GATT Explorer
        </h2>
        <button
          onClick={handleConnect}
          disabled={!selectedDeviceId && !connected}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
            ${connected
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
              : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30'
            } disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          {connected ? (
            <>
              <BluetoothConnected className="w-3.5 h-3.5" />
              Disconnect
            </>
          ) : (
            <>
              <Bluetooth className="w-3.5 h-3.5" />
              {connecting ? 'Connecting...' : 'Connect'}
            </>
          )}
        </button>
      </div>

      {!selectedDeviceId && !connected && (
        <div className="text-sm text-slate-500 bg-slate-900/50 rounded-lg px-4 py-3 border border-slate-800">
          Select a device from the Scanner tab, then connect to explore its GATT services.
        </div>
      )}

      {connected && (
        <div className="text-xs text-emerald-400 flex items-center gap-1.5 bg-emerald-950/50 border border-emerald-900/50 rounded-lg px-3 py-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Connected to {connectedDeviceId ?? 'device'} — {services.length} services discovered
        </div>
      )}

      {services.length === 0 && connected ? (
        <div className="text-sm text-slate-500 italic">No GATT services found</div>
      ) : (
        <div className="space-y-1">
          {services.map((service) => (
            <ServiceRow key={service.uuid + service.handle} service={service} />
          ))}
        </div>
      )}
    </div>
  );
}

function DatabaseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.7-4 3-9 3s-9-1.3-9-3" />
      <path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5" />
    </svg>
  );
}
