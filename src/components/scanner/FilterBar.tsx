'use client';

import { useMemo } from 'react';
import { Search, Filter, X, Star } from 'lucide-react';
import { useScannerStore } from '@/stores/scannerStore';

export function FilterBar() {
  const { filters, setFilters } = useScannerStore();

  const hasActiveFilters = useMemo(() => {
    return (
      filters.nameFilter.length > 0 ||
      filters.uuidFilter.length > 0 ||
      filters.addressFilter.length > 0 ||
      filters.minRssi !== null ||
      filters.maxRssi !== null ||
      filters.connectable !== 'all' ||
      filters.showFavoritesOnly
    );
  }, [filters]);

  const textInputClass =
    'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white placeholder-slate-400 ' +
    'focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all';

  const numericInputClass =
    'w-20 px-2 py-2 text-sm border border-slate-200 rounded-lg bg-white text-center font-mono ' +
    'focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all';

  return (
    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">
          <Filter className="w-3.5 h-3.5" />
          Filters
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Device Name"
              value={filters.nameFilter}
              onChange={(e) => setFilters({ nameFilter: e.target.value })}
              className="pl-8 w-36 text-sm border border-slate-200 rounded-lg bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
            />
            {filters.nameFilter && (
              <button
                onClick={() => setFilters({ nameFilter: '' })}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="UUID"
              value={filters.uuidFilter}
              onChange={(e) => setFilters({ uuidFilter: e.target.value })}
              className="pl-8 w-32 text-sm border border-slate-200 rounded-lg bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
            />
            {filters.uuidFilter && (
              <button
                onClick={() => setFilters({ uuidFilter: '' })}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Address"
              value={filters.addressFilter}
              onChange={(e) => setFilters({ addressFilter: e.target.value })}
              className="pl-8 w-32 text-sm border border-slate-200 rounded-lg bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all font-mono"
            />
            {filters.addressFilter && (
              <button
                onClick={() => setFilters({ addressFilter: '' })}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200" />

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">RSSI</span>
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400">&ge;</span>
            <input
              type="number"
              placeholder="min"
              value={filters.minRssi ?? ''}
              onChange={(e) => setFilters({ minRssi: e.target.value ? Number(e.target.value) : null })}
              className="w-20 px-2 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400">&le;</span>
            <input
              type="number"
              placeholder="max"
              value={filters.maxRssi ?? ''}
              onChange={(e) => setFilters({ maxRssi: e.target.value ? Number(e.target.value) : null })}
              className="w-20 px-2 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200" />

        <select
          value={filters.connectable}
          onChange={(e) => setFilters({ connectable: e.target.value as 'all' | 'connectable' | 'non-connectable' })}
          className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all cursor-pointer"
        >
          <option value="all">All Devices</option>
          <option value="connectable">Connectable</option>
          <option value="non-connectable">Non-connectable</option>
        </select>

        <label
          className={`
            inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-all select-none
            ${
              filters.showFavoritesOnly
                ? 'bg-amber-50 border border-amber-200 text-amber-700'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            }
          `}
        >
          <input
            type="checkbox"
            checked={filters.showFavoritesOnly}
            onChange={(e) => setFilters({ showFavoritesOnly: e.target.checked })}
            className="sr-only"
          />
          <Star
            className="w-3.5 h-3.5"
            fill={filters.showFavoritesOnly ? 'currentColor' : 'none'}
          />
          Favorites
        </label>

        {hasActiveFilters && (
          <button
            onClick={() => setFilters({
              nameFilter: '',
              uuidFilter: '',
              addressFilter: '',
              minRssi: null,
              maxRssi: null,
              connectable: 'all',
              showFavoritesOnly: false,
            })}
            className="ml-auto text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
          >
            <X className="w-3 h-3" />
            Clear All
          </button>
        )}
      </div>
    </div>
  );
}
