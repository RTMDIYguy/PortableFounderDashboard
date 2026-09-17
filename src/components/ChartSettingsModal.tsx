import React, { useState } from 'react';
import { 
  X, 
  Settings2, 
  Check,
} from 'lucide-react';
import { ChartConfig, ChartType, ColumnSchema, AggregationType } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: ChartConfig;
  schema: ColumnSchema[];
  onSave: (updatedConfig: ChartConfig) => void;
}

const PALETTES = [
  { name: 'Geometric Indigo', colors: ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#312e81'] },
  { name: 'Geometric Multi', colors: ['#4f46e5', '#059669', '#d97706', '#0284c7', '#7c3aed', '#db2777'] },
  { name: 'Emerald Forest', colors: ['#059669', '#10b981', '#34d399', '#6ee7b7', '#047857', '#064e3b'] },
  { name: 'Executive Slate', colors: ['#334155', '#475569', '#64748b', '#94a3b8', '#1e293b', '#0f172a'] },
  { name: 'Sunset Amber', colors: ['#d97706', '#f59e0b', '#fbbf24', '#f97316', '#ef4444', '#b45309'] },
];

const CHART_TYPES: { type: ChartType; label: string; desc: string }[] = [
  { type: 'bar', label: 'Vertical Bar', desc: 'Category comparison' },
  { type: 'horizontal-bar', label: 'Horizontal Bar', desc: 'Ranking & long labels' },
  { type: 'stacked-bar', label: 'Stacked Bar', desc: 'Part-to-whole categorical' },
  { type: 'line', label: 'Multi-Line Trend', desc: 'Time series progression' },
  { type: 'area', label: 'Gradient Area', desc: 'Volume & trend over time' },
  { type: 'stacked-area', label: 'Stacked Area', desc: 'Cumulative volume composition' },
  { type: 'donut', label: 'Donut Chart', desc: 'Proportional distribution' },
  { type: 'pie', label: 'Standard Pie', desc: 'Percentage breakdown' },
  { type: 'composed', label: 'Dual-Axis Composed', desc: 'Combined Bar + Line metrics' },
  { type: 'scatter', label: 'Scatter & Bubble', desc: 'Correlation between 2-3 variables' },
  { type: 'radar', label: 'Radar Polygon', desc: 'Multi-variable category profiling' },
  { type: 'heatmap', label: 'Matrix Heatmap', desc: '2D cross-tabular intensity' },
  { type: 'correlation', label: 'Correlation Grid', desc: 'Statistical Pearson coefficients' },
];

export const ChartSettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  config,
  schema,
  onSave,
}) => {
  const [formData, setFormData] = useState<ChartConfig>({ ...config });

  if (!isOpen) return null;

  const numericCols = schema.filter(s => s.type === 'number');
  const allCols = schema;

  const handleToggleYKey = (key: string) => {
    const isSingleMetricType = ['pie', 'donut', 'scatter'].includes(formData.type);

    if (isSingleMetricType) {
      setFormData({ ...formData, yAxisKeys: [key] });
      return;
    }

    const current = formData.yAxisKeys;
    const exists = current.includes(key);
    let updated = exists ? current.filter(k => k !== key) : [...current, key];
    if (updated.length === 0) updated = [key]; // keep at least one

    setFormData({ ...formData, yAxisKeys: updated });
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="flex flex-col w-full max-w-2xl max-h-[90vh] rounded-lg bg-white shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-sm bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              Δ
            </div>
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight">Configure Visualization</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Chart Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Chart Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-600 focus:outline-hidden font-medium"
            />
          </div>

          {/* Chart Type Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Visualization Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CHART_TYPES.map(ct => {
                const isSelected = formData.type === ct.type;
                return (
                  <button
                    key={ct.type}
                    onClick={() => setFormData({ ...formData, type: ct.type })}
                    className={`flex flex-col text-left p-2.5 rounded border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`text-xs font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                      {ct.label}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5 truncate">{ct.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dimension (X-Axis) and Metric (Y-Axis) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* X-Axis */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Dimension / X-Axis
              </label>
              <select
                value={formData.xAxisKey}
                onChange={e => setFormData({ ...formData, xAxisKey: e.target.value })}
                className="w-full rounded border border-slate-300 bg-white p-2 text-xs font-medium text-slate-800 focus:border-indigo-600 focus:outline-hidden cursor-pointer"
              >
                {allCols.map(col => (
                  <option key={col.key} value={col.key}>
                    {col.label} ({col.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Aggregation */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Data Aggregation
              </label>
              <select
                value={formData.aggregation}
                onChange={e => setFormData({ ...formData, aggregation: e.target.value as AggregationType })}
                className="w-full rounded border border-slate-300 bg-white p-2 text-xs font-medium text-slate-800 focus:border-indigo-600 focus:outline-hidden cursor-pointer"
              >
                <option value="sum">Sum (Total)</option>
                <option value="avg">Average (Mean)</option>
                <option value="count">Count of Records</option>
                <option value="min">Minimum Value</option>
                <option value="max">Maximum Value</option>
                <option value="none">None (Raw First)</option>
              </select>
            </div>
          </div>

          {/* Y-Axis Metrics Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Metrics / Y-Axis Values
            </label>
            <div className="flex flex-wrap gap-2">
              {numericCols.map(col => {
                const isSelected = formData.yAxisKeys.includes(col.key);
                return (
                  <button
                    key={col.key}
                    type="button"
                    onClick={() => handleToggleYKey(col.key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                    <span>{col.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Secondary Metric for Composed Chart or Scatter */}
          {formData.type === 'composed' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Secondary Y-Axis Metric (Right Line Axis)
              </label>
              <select
                value={formData.secondaryYAxisKey || ''}
                onChange={e => setFormData({ ...formData, secondaryYAxisKey: e.target.value })}
                className="w-full rounded border border-slate-300 bg-white p-2 text-xs font-medium text-slate-800 focus:border-indigo-600 focus:outline-hidden cursor-pointer"
              >
                <option value="">None / Automatic</option>
                {numericCols.map(col => (
                  <option key={col.key} value={col.key}>
                    {col.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sorting and limits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Sorting</label>
              <select
                value={formData.sortBy || 'none'}
                onChange={e => setFormData({ ...formData, sortBy: e.target.value as any })}
                className="w-full rounded border border-slate-300 bg-white p-2 text-xs font-medium text-slate-800 focus:border-indigo-600 focus:outline-hidden cursor-pointer"
              >
                <option value="none">Natural / Unsorted</option>
                <option value="y-desc">Value (High to Low)</option>
                <option value="y-asc">Value (Low to High)</option>
                <option value="x-asc">Category (A to Z / Chronological)</option>
                <option value="x-desc">Category (Z to A)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Curve Style</label>
              <select
                value={formData.curveType || 'monotone'}
                onChange={e => setFormData({ ...formData, curveType: e.target.value as any })}
                className="w-full rounded border border-slate-300 bg-white p-2 text-xs font-medium text-slate-800 focus:border-indigo-600 focus:outline-hidden cursor-pointer"
              >
                <option value="monotone">Smooth Curve (Monotone)</option>
                <option value="linear">Straight Line (Linear)</option>
                <option value="step">Step Staged (Step)</option>
              </select>
            </div>
          </div>

          {/* Color Palettes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Color Palette</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PALETTES.map(p => {
                const isSelected = JSON.stringify(formData.colorPalette) === JSON.stringify(p.colors);
                return (
                  <button
                    key={p.name}
                    onClick={() => setFormData({ ...formData, colorPalette: p.colors })}
                    className={`flex flex-col p-2.5 rounded border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-700 mb-1.5">{p.name}</span>
                    <div className="flex gap-1 h-3.5">
                      {p.colors.map((c, i) => (
                        <div key={i} className="flex-1 rounded-xs" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Display Toggles */}
          <div className="flex flex-wrap gap-6 pt-2 border-t border-slate-200">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showGrid}
                onChange={e => setFormData({ ...formData, showGrid: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Show Grid Lines
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showLegend}
                onChange={e => setFormData({ ...formData, showLegend: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Show Legend
            </label>
            {formData.type !== 'heatmap' && formData.type !== 'correlation' && (
              <label className="flex items-center gap-2 text-xs font-semibold text-indigo-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.forecastingEnabled ?? false}
                  onChange={e => setFormData({ ...formData, forecastingEnabled: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                30-Day Predictive Forecasting
              </label>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 bg-slate-50">
          <button
            onClick={onClose}
            className="rounded border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-xs cursor-pointer"
          >
            Apply Changes
          </button>
        </div>

      </div>
    </div>
  );
};
