import { useScannerStore } from '@/stores/scannerStore';
import { Radio, FileSearch, Database, Waves } from 'lucide-react';

const tabs = [
  { id: 'scanner' as const, label: 'Scanner', icon: Radio },
  { id: 'analyzer' as const, label: 'Analyzer', icon: FileSearch },
  { id: 'gatt' as const, label: 'GATT', icon: Database },
  { id: 'sniff' as const, label: 'Sniff', icon: Waves },
];

export default function Sidebar() {
  const { activeTab, setActiveTab } = useScannerStore();

  return (
    <aside className="w-16 lg:w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
      <div className="flex-1 py-4 px-2 space-y-1">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150
                ${active
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span className="hidden lg:inline">{label}</span>
              {active && (
                <div className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400" />
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
