import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bell, 
  AlertTriangle, 
  ShieldAlert, 
  Check, 
  Trash2, 
  Plus, 
  SlidersHorizontal,
  Info,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { MetricAlertThreshold, ThresholdCondition } from '../types';
import { formatNumber } from '../utils/dataProcessing';

export interface AvailableMetricInfo {
  key: string;
  label: string;
  currentValue: number;
  unit?: string;
  suggestedCondition?: ThresholdCondition;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  availableMetrics: AvailableMetricInfo[];
  selectedMetricKey?: string | null;
  thresholds: Record<string, MetricAlertThreshold>;
  onSaveThreshold: (threshold: MetricAlertThreshold) => void;
  onDeleteThreshold: (metricKey: string) => void;
  onResetDefaults?: () => void;
}

export const MetricThresholdModal: React.FC<Props> = ({
  isOpen,
  onClose,
  availableMetrics,
  selectedMetricKey,
  thresholds,
  onSaveThreshold,
  onDeleteThreshold,
  onResetDefaults,
}) => {
  const [activeKey, setActiveKey] = useState<string>(
    selectedMetricKey || availableMetrics[0]?.key || ''
  );

  useEffect(() => {
    if (selectedMetricKey) {
      setActiveKey(selectedMetricKey);
    } else if (!activeKey && availableMetrics.length > 0) {
      setActiveKey(availableMetrics[0].key);
    }
  }, [selectedMetricKey, availableMetrics, activeKey]);

  const currentMetric = availableMetrics.find(m => m.key === activeKey) || availableMetrics[0];
  const existingThreshold = activeKey ? thresholds[activeKey] : undefined;

  // Form State
  const [enabled, setEnabled] = useState<boolean>(true);
  const [condition, setCondition] = useState<ThresholdCondition>('greater_than');
  const [thresholdValue, setThresholdValue] = useState<string>('0');
  const [severity, setSeverity] = useState<'warning' | 'critical'>('warning');
  const [customMessage, setCustomMessage] = useState<string>('');

  // Sync form state when activeKey or existingThreshold changes
  useEffect(() => {
    if (existingThreshold) {
      setEnabled(existingThreshold.enabled);
      setCondition(existingThreshold.condition);
      setThresholdValue(String(existingThreshold.thresholdValue));
      setSeverity(existingThreshold.severity || 'warning');
      setCustomMessage(existingThreshold.customMessage || '');
    } else if (currentMetric) {
      setEnabled(true);
      const defaultCondition = currentMetric.suggestedCondition || 'greater_than';
      setCondition(defaultCondition);
      // Sensible initial threshold: e.g. currentValue * 1.15 for greater_than, or currentValue * 0.85 for less_than
      const initialVal = defaultCondition === 'greater_than' 
        ? Math.round(currentMetric.currentValue * 1.15) 
        : Math.round(currentMetric.currentValue * 0.85);
      setThresholdValue(String(Math.max(0, initialVal)));
      setSeverity('warning');
      setCustomMessage('');
    }
  }, [activeKey, existingThreshold, currentMetric]);

  if (!isOpen) return null;

  const numVal = parseFloat(thresholdValue) || 0;
  const currVal = currentMetric ? currentMetric.currentValue : 0;

  // Test if threshold currently triggers
  const isTriggered = enabled && (
    condition === 'greater_than' ? currVal > numVal : currVal < numVal
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMetric) return;

    const updated: MetricAlertThreshold = {
      id: existingThreshold?.id || `threshold-${activeKey}-${Date.now()}`,
      metricKey: activeKey,
      metricLabel: currentMetric.label,
      condition,
      thresholdValue: numVal,
      enabled,
      severity,
      customMessage: customMessage.trim() || undefined,
    };

    onSaveThreshold(updated);
    onClose();
  };

  const handleDelete = () => {
    if (activeKey) {
      onDeleteThreshold(activeKey);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800 border border-amber-200">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
                Custom KPI Alert Thresholds
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Set proactive warning limits for numeric metrics to detect operational anomalies early.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body: Two-column layout on medium screens */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Column: Metric Selector & Overview */}
          <div className="md:col-span-5 space-y-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Select Metric to Configure
            </label>
            <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
              {availableMetrics.map(m => {
                const isSelected = m.key === activeKey;
                const thr = thresholds[m.key];
                const triggered = thr && thr.enabled && (
                  thr.condition === 'greater_than' ? m.currentValue > thr.thresholdValue : m.currentValue < thr.thresholdValue
                );

                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setActiveKey(m.key)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected 
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold shadow-2xs' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate">{m.label}</div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                        Current: <strong className="text-slate-900">{formatNumber(m.currentValue)}</strong> {m.unit || ''}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {thr && thr.enabled ? (
                        triggered ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                            <AlertTriangle className="h-3 w-3 text-amber-700" />
                            Triggered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Check className="h-3 w-3" />
                            Active
                          </span>
                        )
                      ) : thr && !thr.enabled ? (
                        <span className="text-[10px] text-slate-400 font-medium">Off</span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            {onResetDefaults && (
              <button
                type="button"
                onClick={onResetDefaults}
                className="w-full text-center text-xs font-bold text-slate-500 hover:text-indigo-600 py-2 border border-dashed border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Reset Recommended Defaults
              </button>
            )}
          </div>

          {/* Right Column: Threshold Configuration Form */}
          <div className="md:col-span-7 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
            {currentMetric ? (
              <form onSubmit={handleSave} className="space-y-4">
                {/* Metric Summary Card */}
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Target Metric
                    </span>
                    <h3 className="text-sm font-black text-slate-900">
                      {currentMetric.label}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Current Value
                    </span>
                    <div className="text-base font-black font-mono text-slate-900">
                      {formatNumber(currentMetric.currentValue)} {currentMetric.unit || ''}
                    </div>
                  </div>
                </div>

                {/* Enable Alert Toggle */}
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white">
                  <div className="flex items-center gap-2">
                    <Bell className={`h-4 w-4 ${enabled ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold text-slate-800">
                      Alert Rule Enabled
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={enabled} 
                      onChange={e => setEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Threshold Condition */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Trigger Condition
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCondition('greater_than')}
                      className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        condition === 'greater_than'
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <ArrowUpRight className="h-4 w-4 text-indigo-600 shrink-0" />
                      <div>
                        <div className="text-xs font-bold">Exceeds (&gt;)</div>
                        <div className="text-[10px] text-slate-500 font-normal">Spikes above limit</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCondition('less_than')}
                      className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        condition === 'less_than'
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <ArrowDownRight className="h-4 w-4 text-indigo-600 shrink-0" />
                      <div>
                        <div className="text-xs font-bold">Drops Below (&lt;)</div>
                        <div className="text-[10px] text-slate-500 font-normal">Falls below target</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Threshold Value Input & Quick Presets */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Threshold Limit
                    </label>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setThresholdValue(String(Math.round(currVal * 0.9)))}
                        className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium cursor-pointer"
                      >
                        -10%
                      </button>
                      <button
                        type="button"
                        onClick={() => setThresholdValue(String(Math.round(currVal)))}
                        className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium cursor-pointer"
                      >
                        Current ({formatNumber(currVal)})
                      </button>
                      <button
                        type="button"
                        onClick={() => setThresholdValue(String(Math.round(currVal * 1.1)))}
                        className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium cursor-pointer"
                      >
                        +10%
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={thresholdValue}
                      onChange={e => setThresholdValue(e.target.value)}
                      required
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold font-mono text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                      placeholder="e.g. 500"
                    />
                    {currentMetric.unit && (
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">
                        {currentMetric.unit}
                      </span>
                    )}
                  </div>
                </div>

                {/* Warning Severity */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Warning Severity Level
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSeverity('warning')}
                      className={`p-2 rounded-lg border text-left flex items-center gap-2 cursor-pointer transition-all ${
                        severity === 'warning'
                          ? 'border-amber-400 bg-amber-50 text-amber-950 font-bold'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                      <div className="text-xs">
                        <div className="font-bold">Subtle Warning</div>
                        <div className="text-[10px] text-slate-500">Soft amber indicator</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSeverity('critical')}
                      className={`p-2 rounded-lg border text-left flex items-center gap-2 cursor-pointer transition-all ${
                        severity === 'critical'
                          ? 'border-rose-400 bg-rose-50 text-rose-950 font-bold'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
                      <div className="text-xs">
                        <div className="font-bold">Critical Alert</div>
                        <div className="text-[10px] text-slate-500">High-priority notice</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Custom Note (Optional) */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Operational Context Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={customMessage}
                    onChange={e => setCustomMessage(e.target.value)}
                    placeholder="e.g. Requires founder budget review if exceeded"
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                  />
                </div>

                {/* Live Trigger Simulation Banner */}
                <div className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                  !enabled 
                    ? 'bg-slate-50 border-slate-200 text-slate-500' 
                    : isTriggered 
                    ? (severity === 'critical' ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-amber-50 border-amber-300 text-amber-900')
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="flex items-center gap-2">
                    {!enabled ? (
                      <Info className="h-4 w-4 text-slate-400 shrink-0" />
                    ) : isTriggered ? (
                      <AlertTriangle className={`h-4 w-4 shrink-0 ${severity === 'critical' ? 'text-rose-600' : 'text-amber-600'}`} />
                    ) : (
                      <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    )}
                    <div>
                      {!enabled ? (
                        <span>Threshold is currently disabled</span>
                      ) : isTriggered ? (
                        <span>
                          <strong>Warning Active:</strong> Current value ({formatNumber(currVal)}) {condition === 'greater_than' ? 'exceeds' : 'is below'} threshold ({formatNumber(numVal)})
                        </span>
                      ) : (
                        <span>
                          <strong>Normal:</strong> Current value ({formatNumber(currVal)}) is within safe operational limits
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2">
                  {existingThreshold ? (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-800 px-2.5 py-1.5 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove Rule
                    </button>
                  ) : <div />}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Save Alert Rule
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                Select a metric from the list to configure its alert threshold.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
