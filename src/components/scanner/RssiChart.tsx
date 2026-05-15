'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { BleDevice } from '@/types/ble-types';
import { Activity, Minus } from 'lucide-react';

interface RssiDataPoint {
  time: string;
  rssi: number;
  quality: 'good' | 'ok' | 'poor';
}

function rssiColor(rssi: number): string {
  if (rssi >= -65) return '#10b981';
  if (rssi >= -75) return '#f59e0b';
  return '#ef4444';
}

function rssiQuality(rssi: number): 'good' | 'ok' | 'poor' {
  if (rssi >= -65) return 'good';
  if (rssi >= -75) return 'ok';
  return 'poor';
}

export function RssiChart({ device }: { device: BleDevice | null }) {
  const chartData = useMemo(() => {
    if (!device || !device.rssiHistory.length) return [];

    return device.rssiHistory.map((entry) => ({
      time: new Date(entry.timestamp).toLocaleTimeString(),
      rssi: entry.rssi,
      quality: entry.rssi >= -65 ? 'good' as const : entry.rssi >= -75 ? 'ok' as const : 'poor' as const,
    }));
  }, [device]);

  if (!device) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400">
        <Activity className="w-10 h-10 text-slate-300 mb-2" />
        <p className="text-sm">Select a device to view RSSI chart</p>
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400">
        <Minus className="w-10 h-10 text-slate-300 mb-2" />
        <p className="text-sm">No signal history available</p>
      </div>
    );
  }

  const currentRssi = device.rssi;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b border-slate-200 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500" />
          Signal Strength
        </span>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1.5 rounded-full bg-emerald-500" />
            Good (&ge; -65)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1.5 rounded-full bg-amber-500" />
            OK
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1.5 rounded-full bg-red-500" />
            Poor
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-[200px] p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="time"
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              interval={chartData.length > 20 ? 'preserveStartEnd' : Math.floor(chartData.length / 10)}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              domain={[
                Math.min(...chartData.map((d) => d.rssi) - 5,
                Math.max(...chartData.map((d) => d.rssi) + 5),
              ]}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                fontSize: '12px',
              }}
              labelFormatter={(label: string) => `Time: ${label}`}
              formatter={(value: number, name: string) => [`${value} dBm`, 'RSSI']}
            />
            <ReferenceLine
              y={-65}
              stroke="#10b981"
              strokeDasharray="4 4"
              strokeOpacity={0.3}
            />
            <ReferenceLine
              y={-75}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeOpacity={0.3}
            />
            <Line
              type="monotone"
              dataKey="rssi"
              stroke={rssiColor(currentRssi)}
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload } = props;
                const color = rssiColor(payload.rssi);
                return payload === chartData[chartData.length - 1] ? (
                  <circle key={cx} cx={cx} cy={cy} r={4} fill={color} stroke="#fff" strokeWidth={2} />
                ) : (
                  <circle key={cx} cx={cx} cy={cy} r={2} fill={color} />
                );
              }}
              activeDot={{ r: 5, fill: rssiColor(currentRssi), stroke: '#fff', strokeWidth: 2 }}
              animationDuration={300}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="px-4 py-2 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
        <span>{chartData.length} data points</span>
        <span>Current: <span className="font-mono font-medium" style={{ color: rssiColor(currentRssi) }}>
          {currentRssi} dBm
        </span></span>
      </div>
    </div>
  );
}
