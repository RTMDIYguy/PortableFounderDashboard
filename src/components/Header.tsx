import React from 'react';
import { 
  UploadCloud, 
  Table2, 
  Plus, 
  Download, 
  RotateCcw,
  SlidersHorizontal,
  Activity,
  ShieldCheck,
  BookOpen,
  DollarSign,
  Layers,
  LogOut,
  UserCheck
} from 'lucide-react';
import { Dataset } from '../types';

interface Props {
  datasets: Dataset[];
  activeDataset: Dataset;
  onSelectDataset: (dataset: Dataset) => void;
  onOpenImporter: () => void;
  onOpenDataEditor: () => void;
  onOpenAgentLabSync: () => void;
  onOpenPlaybook: () => void;
  onOpenFinancialBoard: () => void;
  onOpenTechStackRegistry: () => void;
  onAddChart: () => void;
  onExportData: (format: 'csv' | 'json') => void;
  onResetLayout: () => void;
  totalFilteredCount: number;
  currentUserEmail?: string;
  currentUserName?: string;
  currentUserPhoto?: string | null;
  organization?: string;
  onLogout?: () => void;
}

export const Header: React.FC<Props> = ({
  datasets,
  activeDataset,
  onSelectDataset,
  onOpenImporter,
  onOpenDataEditor,
  onOpenAgentLabSync,
  onOpenPlaybook,
  onOpenFinancialBoard,
  onOpenTechStackRegistry,
  onAddChart,
  onExportData,
  onResetLayout,
  totalFilteredCount,
  currentUserEmail,
  currentUserName,
  currentUserPhoto,
  organization,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 lg:px-8 py-3.5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Brand with Geometric Balance Logo & Navigation */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-sm flex items-center justify-center text-white font-bold text-xl shadow-xs select-none">
              Δ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight uppercase text-slate-900">
                  Portable Founder
                </span>
                <span className="inline-flex items-center rounded-sm bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200/80 uppercase tracking-wider">
                  Dashboard
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block font-medium">
                Executive analytics, tech stack lifecycle &amp; runway control
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden md:block" />

          {/* Dataset Switcher */}
          <div className="relative">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Active Dataset
            </label>
            <select
              id="dataset-selector"
              aria-label="Active Dataset"
              value={activeDataset.id}
              onChange={e => {
                const found = datasets.find(d => d.id === e.target.value);
                if (found) onSelectDataset(found);
              }}
              className="mt-0.5 rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-2xs hover:bg-white focus:border-indigo-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-600/30"
            >
              {datasets.map((d, index) => (
                <option key={`${d.id}-${index}`} value={d.id}>
                  {d.name} ({d.data.length} rows)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Actions & Live Operational Status */}
        <div className="flex items-center flex-wrap gap-3">
          
          {/* Tech Stack Registry Quick Button */}
          <button
            id="btn-open-tech-stack"
            onClick={onOpenTechStackRegistry}
            className="inline-flex items-center gap-1.5 rounded border border-indigo-300 bg-indigo-50/90 px-3 py-1.5 text-xs font-bold text-indigo-900 shadow-2xs hover:bg-indigo-100 hover:border-indigo-400 transition-colors cursor-pointer"
            title="Open Tech Stack Registry: Track active tools, legacy available backups, and past lost access with reasons"
          >
            <Layers className="h-4 w-4 text-indigo-600" />
            <span>Tech Stack</span>
            <span className="rounded bg-indigo-200/80 px-1.5 py-0.2 text-[10px] font-bold text-indigo-900 font-mono">
              Active & Lost
            </span>
          </button>

          {/* Financial Board Quick Button */}
          <button
            id="btn-open-financial-board"
            onClick={onOpenFinancialBoard}
            className="inline-flex items-center gap-1.5 rounded border border-emerald-300 bg-emerald-50/80 px-3 py-1.5 text-xs font-bold text-emerald-900 shadow-2xs hover:bg-emerald-100 hover:border-emerald-400 transition-colors cursor-pointer"
            title="Open Financial Board: Money Movement, Costs, Due Dates, and Customer Trial Expirations"
          >
            <DollarSign className="h-4 w-4 text-emerald-600" />
            <span>Financial Board</span>
            <span className="rounded bg-emerald-200/80 px-1.5 py-0.2 text-[10px] font-bold text-emerald-900 font-mono">
              Cash & Trials
            </span>
          </button>

          {/* Agent Lab Live Cloud Run & Integrations Sync Button */}
          <button
            id="btn-agentlab-sync"
            onClick={onOpenAgentLabSync}
            className="inline-flex items-center gap-1.5 rounded border border-indigo-200 bg-indigo-50/70 px-3 py-1.5 text-xs font-bold text-indigo-900 shadow-2xs hover:bg-indigo-100 hover:border-indigo-300 transition-colors cursor-pointer"
            title="Connect & query Agent Lab Cloud Run, HubSpot CRM, and MCP Servers"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <span>Agent Lab & Integrations Sync</span>
          </button>

          {/* Operations Playbook / Metric Interpretations Button */}
          <button
            id="btn-open-playbook"
            onClick={onOpenPlaybook}
            className="inline-flex items-center gap-1.5 rounded border border-indigo-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-2xs hover:bg-indigo-50/70 hover:border-indigo-300 transition-colors cursor-pointer"
            title="Open Operational Metric Interpretations & Founder Playbook"
          >
            <BookOpen className="h-4 w-4 text-indigo-600" />
            <span>Metrics Playbook</span>
          </button>

          {/* Data Importer / Upload */}
          <button
            id="btn-import-data"
            onClick={onOpenImporter}
            className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
          >
            <UploadCloud className="h-4 w-4 text-indigo-600" />
            <span>Import / Paste Data</span>
          </button>

          {/* Data Table View */}
          <button
            id="btn-view-table"
            onClick={onOpenDataEditor}
            className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Table2 className="h-4 w-4 text-slate-600" />
            <span>Data Grid</span>
            <span className="rounded bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 text-[10px] font-bold text-indigo-700">
              {totalFilteredCount}
            </span>
          </button>

          {/* Add Visualization Button */}
          <button
            id="btn-add-chart"
            onClick={onAddChart}
            className="inline-flex items-center gap-1.5 rounded bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-600/30"
          >
            <Plus className="h-4 w-4" />
            <span>Add Visualization</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative group">
            <button
              id="btn-export-menu"
              aria-label="Export Data"
              className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Export Dataset"
            >
              <Download className="h-4 w-4" />
            </button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block w-36 rounded-lg border border-slate-200 bg-white py-1 shadow-lg z-50">
              <button
                onClick={() => onExportData('csv')}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 font-semibold cursor-pointer"
              >
                Export as CSV
              </button>
              <button
                onClick={() => onExportData('json')}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 font-semibold cursor-pointer"
              >
                Export as JSON
              </button>
            </div>
          </div>

          {/* Reset Layout */}
          <button
            id="btn-reset-layout"
            onClick={onResetLayout}
            className="inline-flex items-center rounded border border-slate-200 bg-white p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Reset to default preset charts"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          {/* Executive Clearance Profile & Sign-Out */}
          <div className="h-6 w-px bg-slate-200 hidden sm:block" />
          <div className="flex items-center gap-2.5 pl-1">
            <div className="flex items-center gap-2">
              {currentUserPhoto ? (
                <img
                  src={currentUserPhoto}
                  alt={currentUserName || 'Executive'}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full border border-indigo-200 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-600 border border-indigo-700 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                  {currentUserName ? currentUserName.slice(0, 2) : 'EX'}
                </div>
              )}
              <div className="hidden xl:block text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 leading-none">
                    {currentUserName || 'Executive Member'}
                  </span>
                  <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 px-1 py-0.2 text-[9px] font-bold tracking-tight">
                    <UserCheck className="w-2.5 h-2.5" />
                    Cleared
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium truncate max-w-[180px] leading-tight mt-0.5" title={currentUserEmail}>
                  {organization || currentUserEmail || 'Uncle Robert Consulting & Agent Lab'}
                </div>
              </div>
            </div>

            {onLogout && (
              <button
                id="btn-executive-logout"
                onClick={onLogout}
                className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white p-1.5 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
                title={`Sign out (${currentUserEmail || 'Executive'})`}
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
