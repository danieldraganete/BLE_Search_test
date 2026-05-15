'use client';

import { useState, useEffect } from 'react';
import { useScannerStore } from '@/stores/scannerStore';
import { useBleScanner } from '@/hooks/useBleScanner';
import type { BleDevice } from '@/types/ble-types';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { FilterBar } from '@/components/scanner/FilterBar';
import { DeviceTable } from '@/components/scanner/DeviceTable';
import { ScanControls } from '@/components/scanner/ScanControls';
import { AnalyzerView } from '@/components/analyzer/AnalyzerView';
import { GattView } from '@/components/gatt/GattView';
import { SniffView } from '@/components/sniff/SniffView';

export function DashboardPage() {
  const { activeTab, setActiveTab, isScanning, setIsScanning, devices, adapterState } = useScannerStore();

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Header adapterState={adapterState} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} onSelect={setActiveTab} />
        <main className="flex-1 overflow-auto">
          {activeTab === 'scanner' && (
            <div className="flex flex-col h-full">
              <ScanControls />
              <FilterBar />
              <div className="flex-1 overflow-auto">
                <DeviceTable />
              </div>
            </div>
          )}
          {activeTab === 'analyzer' && <AnalyzerView />}
          {activeTab === 'gatt' && <GattView />}
          {activeTab === 'sniff' && <SniffView />}
        </main>
      </div>
    </div>
  );
}
