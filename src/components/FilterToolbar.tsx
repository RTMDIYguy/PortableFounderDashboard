import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown,
  RotateCcw
} from 'lucide-react';
import { ColumnSchema, FilterState } from '../types';

interface Props {
  schema: ColumnSchema[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onResetFilters: () => void;
  filteredCount: number;
  totalCount: number;
}

export const FilterToolbar: React.FC<Props> = ({
  schema,
  filters,
  onFilterChange,
  onResetFilters,
  filteredCount,
  totalCount,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const categoricalCols = schema
    .filter(
      s => (s.type === 'string' || s.type === 'date') && s.uniqueValues && s.uniqueValues.length > 0 && s.uniqueValues.length <= 30
    )
    .sort((a, b) => {
      if (a.key === 'Brand') return -1;
      if (b.key === 'Brand') return 1;
      return 0;
    });

  const categoryFilterCount = (Object.values(filters.categoryFilters) as string[][]).reduce(
    (acc: number, arr: string[]) => acc + (arr && arr.length > 0 ? 1 : 0),
    0
  );
  const searchFilterCount: number = filters.searchQuery ? 1 : 0;
  const numericFilterCount: number = Object.keys(filters.numericRanges).length;
  const activeFilterCount: number = searchFilterCount + categoryFilterCount + numericFilterCount;

  const handleSearch = (q: string) => {
    onFilterChange({
      ...filters,
      searchQuery: q,
    });
  };

  const handleToggleCategoryVal = (colKey: string, val: string) => {
    const current = filters.categoryFilters[colKey] || [];
    const exists = current.includes(val);
    const updated = exists ? current.filter(v => v !== val) : [...current, val];

    onFilterChange({
      ...filters,
      categoryFilters: {
        ...filters.categoryFilters,
        [colKey]: updated,
      },
    });
  };

  const handleClearCategory = (colKey: string) => {
    const next = { ...filters.categoryFilters };
    delete next[colKey];
    onFilterChange({
      ...filters,
      categoryFilters: next,
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
      
      {/* Top row: Section Header & Active Stats */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Global Filters
          </h3>
          {activeFilterCount > 0 && (
            <span className="rounded bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
              {activeFilterCount} active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span>
            Showing <strong className="text-slate-800 font-bold">{filteredCount}</strong> of {totalCount} items
          </span>
          {activeFilterCount > 0 && (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer ml-2"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3">
        
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search keywords, categories, or metrics..."
            value={filters.searchQuery}
            onChange={e => handleSearch(e.target.value)}
            className="w-full rounded border border-slate-200 bg-slate-50 pl-8 pr-8 py-1.5 text-xs text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-600/30 font-medium"
          />
          {filters.searchQuery && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Categorical Dimension Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {categoricalCols.slice(0, 8).map(col => {
            const selectedVals = filters.categoryFilters[col.key] || [];
            const isOpen = openDropdown === col.key;
            const isBrandCol = col.key === 'Brand';

            return (
              <div key={col.key} className="relative">
                <button
                  onClick={() => setOpenDropdown(isOpen ? null : col.key)}
                  className={`inline-flex items-center gap-1.5 rounded text-xs py-1 px-2.5 font-medium border transition-colors cursor-pointer ${
                    selectedVals.length > 0
                      ? isBrandCol
                        ? 'bg-slate-900 border-slate-900 text-white font-bold shadow-xs'
                        : 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
                      : isBrandCol
                      ? 'bg-slate-50 border-slate-300 text-slate-800 font-semibold hover:bg-slate-100'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Filter className={`h-3 w-3 ${selectedVals.length > 0 && isBrandCol ? 'text-white' : 'text-slate-400'}`} />
                  <span>{col.label}</span>
                  {selectedVals.length > 0 && (
                    <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      isBrandCol ? 'bg-indigo-500 text-white' : 'bg-indigo-600 text-white'
                    }`}>
                      {selectedVals.length}
                    </span>
                  )}
                  <ChevronDown className={`h-3 w-3 ${selectedVals.length > 0 && isBrandCol ? 'text-white' : 'text-slate-400'}`} />
                </button>

                {isOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setOpenDropdown(null)}
                    />
                    <div className="absolute left-0 top-full mt-1.5 z-50 w-60 rounded-lg border border-slate-200 bg-white p-2.5 shadow-xl">
                      <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-slate-100 px-1">
                        <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                          {col.label}
                        </span>
                        {selectedVals.length > 0 && (
                          <button
                            onClick={() => handleClearCategory(col.key)}
                            className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                          >
                            Clear All
                          </button>
                        )}
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1 py-1">
                        {col.uniqueValues?.map(val => {
                          const isChecked = selectedVals.includes(val);
                          return (
                            <label
                              key={val}
                              className="flex items-center gap-2 rounded px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer select-none"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleCategoryVal(col.key, val)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="truncate flex-1 font-medium">{val}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* Active Filter Chips / Pills */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Active:
          </span>
          {filters.searchQuery && (
            <span className="inline-flex items-center gap-1 rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-xs text-indigo-800 font-medium">
              Search: "{filters.searchQuery}"
              <button
                onClick={() => handleSearch('')}
                className="text-indigo-500 hover:text-indigo-900 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {Object.entries(filters.categoryFilters).map(([colKey, vals]) => {
            const valList = (vals || []) as string[];
            if (valList.length === 0) return null;
            const colLabel = schema.find(s => s.key === colKey)?.label || colKey;
            return (
              <span
                key={colKey}
                className="inline-flex items-center gap-1 rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-xs text-indigo-800 font-medium"
              >
                {colLabel}: {valList.join(', ')}
                <button
                  onClick={() => handleClearCategory(colKey)}
                  className="text-indigo-500 hover:text-indigo-900 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

    </div>
  );
};
