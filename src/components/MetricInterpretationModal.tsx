import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  X, 
  HelpCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  TrendingUp,
  Cpu,
  Zap,
  Users,
  ShieldCheck
} from 'lucide-react';
import { METRIC_DICTIONARY, MetricInterpretation } from '../utils/metricDefinitions';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialHighlightKey?: string;
}

export const MetricInterpretationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialHighlightKey,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedMetricKey, setSelectedMetricKey] = useState<string>(
    initialHighlightKey || 'hitloverrides'
  );

  if (!isOpen) return null;

  const allMetrics = Object.values(METRIC_DICTIONARY);
  const categories = ['All', 'Tech Stack & Architecture', 'Financial & Cash Flow', 'Agent Lab OS & AI', 'CRM & Revenue', 'Web & Client Portals', 'MCP Servers', 'Operations & Performance'];

  const filteredMetrics = allMetrics.filter(m => {
    const matchesCat = selectedCategory === 'All' || m.category === selectedCategory;
    const matchesSearch = 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.interpretation.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const selectedMetric: MetricInterpretation = 
    METRIC_DICTIONARY[selectedMetricKey] || filteredMetrics[0] || allMetrics[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-xl border border-slate-200 bg-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Operations & Metric Interpretation Playbook
                </h3>
                <span className="rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                  Founder & Co-Founder Guide
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Plain-English operational definitions, ideal baseline ranges, and diagnostic steps for all workflow metrics.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search metrics (e.g., overrides, steps, latency, tokens, deals)..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Split: List on Left, Deep Dive on Right */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          
          {/* Metric Selector List */}
          <div className="md:col-span-4 border-r border-slate-200 overflow-y-auto max-h-[60vh] p-3 space-y-1.5 bg-slate-50/40">
            {filteredMetrics.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No matching metrics found.
              </div>
            ) : (
              filteredMetrics.map((m) => {
                const isSelected = selectedMetric.key === m.key;
                return (
                  <button
                    key={m.key}
                    onClick={() => setSelectedMetricKey(m.key)}
                    className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-indigo-600 shadow-xs'
                        : 'bg-white/60 border-slate-200/80 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                        {m.category}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {m.idealRange}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 mt-1">
                      {m.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                      {m.description}
                    </p>
                  </button>
                );
              })
            )}
          </div>

          {/* Detailed Interpretation Panel */}
          <div className="md:col-span-8 overflow-y-auto max-h-[60vh] p-6 space-y-5 bg-white">
            {selectedMetric ? (
              <>
                {/* Metric Title & Category */}
                <div className="border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800">
                      {selectedMetric.category}
                    </span>
                    <span className="text-xs text-slate-400">Field key: <code className="font-mono">{selectedMetric.key}</code></span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mt-2">
                    {selectedMetric.name}
                  </h2>
                  <p className="text-sm text-slate-600 font-medium mt-1 leading-relaxed">
                    {selectedMetric.description}
                  </p>
                </div>

                {/* Formula / Calculation */}
                {selectedMetric.formula && (
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Calculation / Telemetry Source
                    </div>
                    <code className="text-indigo-900 font-mono font-bold">
                      {selectedMetric.formula}
                    </code>
                  </div>
                )}

                {/* Plain-English Meaning */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4 text-indigo-600" />
                    How to Read & Interpret This Metric
                  </h4>
                  <div className="rounded-lg bg-indigo-50/50 border border-indigo-100 p-4 text-xs text-slate-700 leading-relaxed font-medium">
                    {selectedMetric.interpretation}
                  </div>
                </div>

                {/* Ideal Range vs Warning Signs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-emerald-50/70 border border-emerald-200 p-4 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Target / Healthy Range</span>
                    </div>
                    <p className="text-xs font-semibold text-emerald-800 pt-1">
                      {selectedMetric.idealRange}
                    </p>
                  </div>

                  <div className="rounded-lg bg-rose-50/70 border border-rose-200 p-4 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
                      <AlertTriangle className="h-4 w-4 text-rose-600" />
                      <span>Red Flags & Warning Signs</span>
                    </div>
                    <p className="text-xs text-rose-800 pt-1 leading-relaxed">
                      {selectedMetric.warningSigns}
                    </p>
                  </div>
                </div>

                {/* Operational Impact */}
                <div className="rounded-lg bg-slate-900 text-white p-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                    <ShieldCheck className="h-4 w-4 text-indigo-400" />
                    <span>Executive & Operational Takeaway</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {selectedMetric.operationalImpact}
                  </p>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-slate-400">
                Select a metric from the list to view interpretations.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
          <span>Tip: Hover over the (<HelpCircle className="h-3 w-3 inline text-slate-400" />) icon on any KPI card or chart header for instant explanations.</span>
          <button
            onClick={onClose}
            className="rounded bg-slate-900 px-4 py-1.5 font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
};
