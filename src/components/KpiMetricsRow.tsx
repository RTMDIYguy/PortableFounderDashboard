import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Hash, 
  Activity,
  Layers,
  Sparkles,
  UserCheck,
  Footprints,
  CheckCircle2,
  BookOpen,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  AlertOctagon,
  Server,
  Bell,
  AlertTriangle,
  SlidersHorizontal,
  ShieldAlert
} from 'lucide-react';
import { ColumnSchema, MetricAlertThreshold } from '../types';
import { computeKpis, formatNumber } from '../utils/dataProcessing';
import { MetricTooltip } from './MetricTooltip';
import { MetricThresholdModal, AvailableMetricInfo } from './MetricThresholdModal';

interface Props {
  data: Record<string, any>[];
  schema: ColumnSchema[];
  datasetId?: string;
  onOpenPlaybook?: (metricKey?: string) => void;
}

// Default recommended thresholds per dataset archetype
const getDefaultThresholds = (datasetId?: string, isTechStack?: boolean, isFinancial?: boolean): Record<string, MetricAlertThreshold> => {
  if (isTechStack) {
    return {
      monthlycostusd: {
        id: 'def-tech-spend',
        metricKey: 'monthlycostusd',
        metricLabel: 'Monthly Tech Spend',
        condition: 'greater_than',
        thresholdValue: 250, // Triggers warning if spend > $250/mo
        enabled: true,
        severity: 'warning',
        customMessage: 'Monthly tech spend exceeds $250 budget target',
      },
      lost_tools: {
        id: 'def-lost-tools',
        metricKey: 'lost_tools',
        metricLabel: 'Lost Access & Sunset',
        condition: 'greater_than',
        thresholdValue: 1,
        enabled: true,
        severity: 'critical',
        customMessage: 'Sunset/lost tool count exceeds operational tolerance',
      },
      active_tools: {
        id: 'def-active-tools',
        metricKey: 'active_tools',
        metricLabel: 'Active in Production',
        condition: 'less_than',
        thresholdValue: 4,
        enabled: false,
        severity: 'warning',
        customMessage: 'Active production tool portfolio drops below minimum 4',
      }
    };
  }

  if (isFinancial) {
    return {
      costoutflowusd: {
        id: 'def-fin-outflow',
        metricKey: 'costoutflowusd',
        metricLabel: 'Cost Outflows',
        condition: 'greater_than',
        thresholdValue: 12000,
        enabled: true,
        severity: 'warning',
        customMessage: 'Outflow burn rate exceeds $12,000 threshold',
      },
      netcashimpact: {
        id: 'def-fin-netcash',
        metricKey: 'netcashimpact',
        metricLabel: 'Net Cash Flow',
        condition: 'less_than',
        thresholdValue: 3000,
        enabled: true,
        severity: 'critical',
        customMessage: 'Net cash margin drops below $3,000 threshold',
      },
      urgent_due: {
        id: 'def-fin-due',
        metricKey: 'urgent_due',
        metricLabel: 'Bills Due in 7 Days',
        condition: 'greater_than',
        thresholdValue: 0,
        enabled: true,
        severity: 'warning',
        customMessage: 'Urgent invoices requiring settlement within 7 days',
      }
    };
  }

  return {};
};

export const KpiMetricsRow: React.FC<Props> = ({ data, schema, datasetId, onOpenPlaybook }) => {
  const kpis = computeKpis(data, schema);
  
  // Check if dataset is Tech Stack Lifecycle
  const hasTechName = schema.some(c => /techname/i.test(c.key));
  const hasLifecycle = schema.some(c => /lifecyclestatus/i.test(c.key));
  const isTechStack = hasTechName && hasLifecycle;

  // Check if dataset is Financial Board
  const hasInflow = schema.some(c => /inflow/i.test(c.key));
  const hasCostOutflow = schema.some(c => /costoutflow/i.test(c.key));
  const isFinancial = hasInflow && hasCostOutflow;

  // Local storage key for persistent custom thresholds
  const storageKey = useMemo(() => {
    return `founder_kpi_alert_thresholds_${datasetId || (isTechStack ? 'tech_stack' : isFinancial ? 'financial' : 'generic')}`;
  }, [datasetId, isTechStack, isFinancial]);

  // Alert Thresholds State with LocalStorage Persistence
  const [thresholds, setThresholds] = useState<Record<string, MetricAlertThreshold>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return getDefaultThresholds(datasetId, isTechStack, isFinancial);
  });

  // Keep synced if datasetId changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setThresholds(JSON.parse(saved));
        return;
      }
    } catch {
      // Ignore
    }
    setThresholds(getDefaultThresholds(datasetId, isTechStack, isFinancial));
  }, [storageKey, datasetId, isTechStack, isFinancial]);

  // Persist thresholds changes
  const saveThresholdsToStorage = (updated: Record<string, MetricAlertThreshold>) => {
    setThresholds(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const handleSaveThreshold = (newThreshold: MetricAlertThreshold) => {
    const updated = {
      ...thresholds,
      [newThreshold.metricKey]: newThreshold,
    };
    saveThresholdsToStorage(updated);
  };

  const handleDeleteThreshold = (metricKey: string) => {
    const updated = { ...thresholds };
    delete updated[metricKey];
    saveThresholdsToStorage(updated);
  };

  const handleResetDefaults = () => {
    const def = getDefaultThresholds(datasetId, isTechStack, isFinancial);
    saveThresholdsToStorage(def);
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModalMetricKey, setSelectedModalMetricKey] = useState<string | null>(null);

  const openThresholdModalFor = (metricKey?: string) => {
    setSelectedModalMetricKey(metricKey || null);
    setIsModalOpen(true);
  };

  // Helper function to evaluate whether a metric triggers an alert
  const evaluateAlert = (metricKey: string, currentValue: number) => {
    const thr = thresholds[metricKey];
    if (!thr || !thr.enabled) {
      return { isTriggered: false, threshold: thr };
    }
    const isTriggered = thr.condition === 'greater_than' 
      ? currentValue > thr.thresholdValue 
      : currentValue < thr.thresholdValue;

    return { isTriggered, threshold: thr };
  };

  // Render Subtle Warning Indicator inside a card
  const renderAlertIndicator = (metricKey: string, currentValue: number, fallbackLabel: string, unit: string = '') => {
    const { isTriggered, threshold } = evaluateAlert(metricKey, currentValue);
    if (!isTriggered || !threshold) return null;

    const isCritical = threshold.severity === 'critical';

    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          openThresholdModalFor(metricKey);
        }}
        className={`mt-2.5 p-2 rounded-md border text-[11px] flex items-center justify-between gap-1.5 cursor-pointer transition-all ${
          isCritical
            ? 'bg-rose-50/90 border-rose-300 text-rose-950 hover:bg-rose-100/90'
            : 'bg-amber-50/90 border-amber-300 text-amber-950 hover:bg-amber-100/90'
        }`}
        title="Click to view or adjust alert threshold"
      >
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          <AlertTriangle className={`h-3.5 w-3.5 shrink-0 ${isCritical ? 'text-rose-600' : 'text-amber-700'}`} />
          <span className="truncate font-semibold">
            {threshold.customMessage || (
              threshold.condition === 'greater_than'
                ? `Exceeds threshold (${formatNumber(currentValue)}${unit} > ${formatNumber(threshold.thresholdValue)}${unit})`
                : `Below target threshold (${formatNumber(currentValue)}${unit} < ${formatNumber(threshold.thresholdValue)}${unit})`
            )}
          </span>
        </div>
        <span className={`text-[10px] font-bold underline shrink-0 ${isCritical ? 'text-rose-700 hover:text-rose-900' : 'text-amber-800 hover:text-indigo-800'}`}>
          Adjust
        </span>
      </div>
    );
  };

  // Render Card Top-Right Bell Action
  const renderThresholdBellButton = (metricKey: string, currentValue: number, metricLabel: string) => {
    const { isTriggered, threshold } = evaluateAlert(metricKey, currentValue);

    if (threshold && threshold.enabled) {
      if (isTriggered) {
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openThresholdModalFor(metricKey);
            }}
            className="p-1 rounded text-amber-700 hover:text-amber-900 hover:bg-amber-100/80 transition-colors cursor-pointer relative"
            title={`Alert Active: ${threshold.condition === 'greater_than' ? 'exceeds' : 'below'} ${formatNumber(threshold.thresholdValue)}. Click to reconfigure.`}
          >
            <Bell className="h-3.5 w-3.5 text-amber-600 fill-amber-500/20" />
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-600 ring-1 ring-white"></span>
          </button>
        );
      }

      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openThresholdModalFor(metricKey);
          }}
          className="p-1 rounded text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors cursor-pointer relative"
          title={`Alert Monitored: ${threshold.condition === 'greater_than' ? '>' : '<'} ${formatNumber(threshold.thresholdValue)} (Currently safe). Click to edit.`}
        >
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-1 ring-white"></span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          openThresholdModalFor(metricKey);
        }}
        className="p-1 rounded text-slate-300 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer opacity-80 hover:opacity-100"
        title={`Set custom alert threshold for ${metricLabel}`}
      >
        <Bell className="h-3.5 w-3.5" />
      </button>
    );
  };

  // Helper for dynamic card outer border styling when alert triggers
  const getCardBorderClass = (metricKey: string, currentValue: number) => {
    const { isTriggered, threshold } = evaluateAlert(metricKey, currentValue);
    if (!isTriggered || !threshold) return '';
    if (threshold.severity === 'critical') {
      return 'ring-1 ring-rose-300 border-rose-300 bg-rose-50/20';
    }
    return 'ring-1 ring-amber-300 border-amber-300 bg-amber-50/20';
  };

  // --- Tech Stack Lifecycle Archetype ---
  if (isTechStack) {
    const activeTools = data.filter(r => /active/i.test(String(r.LifecycleStatus)));
    const legacyTools = data.filter(r => /legacy/i.test(String(r.LifecycleStatus)));
    const lostTools = data.filter(r => /lost|deprecated/i.test(String(r.LifecycleStatus)));
    const activeSpend = activeTools.reduce((acc, r) => acc + (Number(r.MonthlyCostUSD) || 0), 0);

    const availableMetrics: AvailableMetricInfo[] = [
      { key: 'monthlycostusd', label: 'Monthly Tech Spend', currentValue: activeSpend, unit: '$/mo', suggestedCondition: 'greater_than' },
      { key: 'active_tools', label: 'Active in Production', currentValue: activeTools.length, unit: 'tools', suggestedCondition: 'less_than' },
      { key: 'legacy_tools', label: 'Legacy Available Backups', currentValue: legacyTools.length, unit: 'tools', suggestedCondition: 'greater_than' },
      { key: 'lost_tools', label: 'Lost Access & Sunset', currentValue: lostTools.length, unit: 'tools', suggestedCondition: 'greater_than' },
    ];

    const triggeredAlertsCount = availableMetrics.filter(m => evaluateAlert(m.key, m.currentValue).isTriggered).length;
    const activeRulesCount = (Object.values(thresholds) as MetricAlertThreshold[]).filter(t => t.enabled).length;

    return (
      <div className="space-y-3">
        {/* Row Header with Alert Threshold Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Operational KPI Metrics
            </span>
            {triggeredAlertsCount > 0 ? (
              <button
                onClick={() => openThresholdModalFor()}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-colors cursor-pointer"
              >
                <AlertTriangle className="h-3 w-3 text-amber-700" />
                {triggeredAlertsCount} Alert{triggeredAlertsCount > 1 ? 's' : ''} Triggered
              </button>
            ) : (
              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                Metrics In Range
              </span>
            )}
          </div>

          <button
            onClick={() => openThresholdModalFor()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-indigo-600 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-md px-2.5 py-1 transition-colors shadow-2xs cursor-pointer"
            title="Configure proactive alert thresholds for metrics"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
            <span>Set Thresholds</span>
            {activeRulesCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-50 text-indigo-700 font-mono font-bold border border-indigo-200">
                {activeRulesCount}
              </span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
          
          {/* Card 1: Active In Production */}
          <div className={`lg:col-span-3 bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between transition-all ${getCardBorderClass('active_tools', activeTools.length)}`}>
            <div>
              <div className="flex items-center justify-between gap-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                  Active in Production
                </p>
                <div className="flex items-center gap-1">
                  {renderThresholdBellButton('active_tools', activeTools.length, 'Active Tools')}
                  <MetricTooltip 
                    metricKey="lifecyclestatus" 
                    label="Lifecycle Status" 
                    align="right"
                    onOpenFullGuide={onOpenPlaybook}
                  />
                </div>
              </div>
              <h2 className="text-2xl font-black text-emerald-700 font-mono mt-1 flex items-center gap-1.5">
                <span>{activeTools.length} Tools</span>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </h2>
              {renderAlertIndicator('active_tools', activeTools.length, 'Active Tools', ' tools')}
            </div>
            <div className="flex items-center justify-between text-[11px] mt-2 pt-1 border-t border-slate-100 font-medium text-slate-500">
              <span>Production Stack</span>
              <span className="text-emerald-700 font-bold">{Math.round((activeTools.length / (data.length || 1)) * 100)}% of Portfolio</span>
            </div>
          </div>

          {/* Card 2: Monthly Software & Compute Spend */}
          <div className={`lg:col-span-3 bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between transition-all ${getCardBorderClass('monthlycostusd', activeSpend)}`}>
            <div>
              <div className="flex items-center justify-between gap-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                  Monthly Tech Spend
                </p>
                <div className="flex items-center gap-1">
                  {renderThresholdBellButton('monthlycostusd', activeSpend, 'Monthly Tech Spend')}
                  <MetricTooltip 
                    metricKey="monthlycostusd" 
                    label="Monthly Tech Spend" 
                    align="right"
                    onOpenFullGuide={onOpenPlaybook}
                  />
                </div>
              </div>
              <h2 className="text-2xl font-black text-indigo-700 font-mono mt-1 flex items-center gap-1">
                <span>${formatNumber(activeSpend)}</span>
                <span className="text-xs text-slate-400 font-bold">/mo</span>
              </h2>
              {renderAlertIndicator('monthlycostusd', activeSpend, 'Monthly Tech Spend', ' $/mo')}
            </div>
            <div className="flex items-center justify-between text-[11px] mt-2 pt-1 border-t border-slate-100 font-medium text-slate-500">
              <span>Cloud, LLMs & SaaS</span>
              <span className="text-indigo-700 font-bold font-mono">${(activeSpend / (activeTools.length || 1)).toFixed(0)} avg/tool</span>
            </div>
          </div>

          {/* Card 3: Legacy Available */}
          <div className={`lg:col-span-3 bg-amber-50/50 p-4 rounded-lg border border-amber-200 shadow-xs flex flex-col justify-between transition-all ${getCardBorderClass('legacy_tools', legacyTools.length)}`}>
            <div>
              <div className="flex items-center justify-between gap-1">
                <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest truncate">
                  Legacy Available Backups
                </p>
                <div className="flex items-center gap-1">
                  {renderThresholdBellButton('legacy_tools', legacyTools.length, 'Legacy Tools')}
                  <MetricTooltip 
                    metricKey="lifecyclestatus" 
                    label="Legacy Available" 
                    align="right"
                    onOpenFullGuide={onOpenPlaybook}
                  />
                </div>
              </div>
              <h2 className="text-2xl font-black text-amber-900 font-mono mt-1 flex items-center gap-1.5">
                <span>{legacyTools.length} Tools</span>
                <Clock className="h-5 w-5 text-amber-600" />
              </h2>
              {renderAlertIndicator('legacy_tools', legacyTools.length, 'Legacy Tools', ' tools')}
            </div>
            <div className="flex items-center justify-between text-[11px] mt-2 pt-1 border-t border-amber-200 font-medium text-amber-800">
              <span>Grandfathered / Free Tiers</span>
              <span className="font-bold">Credentials Retained</span>
            </div>
          </div>

          {/* Card 4: Lost Access & Decommissioned */}
          <div className={`lg:col-span-3 bg-rose-50/70 p-4 rounded-lg border border-rose-200 shadow-xs flex flex-col justify-between transition-all ${getCardBorderClass('lost_tools', lostTools.length)}`}>
            <div>
              <div className="flex items-center justify-between gap-1">
                <p className="text-[10px] font-bold text-rose-800 uppercase tracking-widest truncate">
                  Lost Access & Sunset
                </p>
                <div className="flex items-center gap-1">
                  {renderThresholdBellButton('lost_tools', lostTools.length, 'Lost Access Tools')}
                  <MetricTooltip 
                    metricKey="healthscore" 
                    label="Lost Access Registry" 
                    align="left"
                    onOpenFullGuide={onOpenPlaybook}
                  />
                </div>
              </div>
              <h2 className="text-2xl font-black text-rose-900 font-mono mt-1 flex items-center gap-1.5">
                <span>{lostTools.length} Tools</span>
                <AlertOctagon className="h-5 w-5 text-rose-600" />
              </h2>
              {renderAlertIndicator('lost_tools', lostTools.length, 'Lost Access Tools', ' tools')}
            </div>
            <div className="flex items-center justify-between text-[11px] mt-2 pt-1 border-t border-rose-200 font-medium text-rose-800">
              <span>Reasons Documented</span>
              <span className="font-bold text-rose-700">Cost & Sunset Post-Mortems</span>
            </div>
          </div>

        </div>

        {/* Threshold Configuration Modal */}
        <MetricThresholdModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          availableMetrics={availableMetrics}
          selectedMetricKey={selectedModalMetricKey}
          thresholds={thresholds}
          onSaveThreshold={handleSaveThreshold}
          onDeleteThreshold={handleDeleteThreshold}
          onResetDefaults={handleResetDefaults}
        />
      </div>
    );
  }

  // --- Financial Board Archetype ---
  if (isFinancial) {
    const totalInflow = data.reduce((acc, r) => acc + (Number(r.InflowUSD) || 0), 0);
    const totalOutflow = data.reduce((acc, r) => acc + (Number(r.CostOutflowUSD) || 0), 0);
    const netCash = totalInflow - totalOutflow;
    const trials = data.filter(r => Number(r.TrialDaysLeft) > 0 || /trial/i.test(String(r.TransactionType)));
    const trialPipeline = trials.reduce((acc, r) => acc + (Number(r.SalesRevenueUSD) || 0), 0);
    const urgentDue = data.filter(r => Number(r.DaysUntilDue) <= 7 && Number(r.DaysUntilDue) > 0).length;

    const availableMetrics: AvailableMetricInfo[] = [
      { key: 'inflowusd', label: 'Total Cash Inflows', currentValue: totalInflow, unit: '$', suggestedCondition: 'less_than' },
      { key: 'costoutflowusd', label: 'Cost Outflows', currentValue: totalOutflow, unit: '$', suggestedCondition: 'greater_than' },
      { key: 'netcashimpact', label: 'Net Cash Flow', currentValue: netCash, unit: '$', suggestedCondition: 'less_than' },
      { key: 'urgent_due', label: 'Bills Due in 7 Days', currentValue: urgentDue, unit: 'bills', suggestedCondition: 'greater_than' },
    ];

    const triggeredAlertsCount = availableMetrics.filter(m => evaluateAlert(m.key, m.currentValue).isTriggered).length;
    const activeRulesCount = (Object.values(thresholds) as MetricAlertThreshold[]).filter(t => t.enabled).length;

    return (
      <div className="space-y-3">
        {/* Row Header with Alert Threshold Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Financial KPI Metrics
            </span>
            {triggeredAlertsCount > 0 ? (
              <button
                onClick={() => openThresholdModalFor()}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-colors cursor-pointer"
              >
                <AlertTriangle className="h-3 w-3 text-amber-700" />
                {triggeredAlertsCount} Alert{triggeredAlertsCount > 1 ? 's' : ''} Triggered
              </button>
            ) : (
              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                All Financials In Safe Range
              </span>
            )}
          </div>

          <button
            onClick={() => openThresholdModalFor()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-indigo-600 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-md px-2.5 py-1 transition-colors shadow-2xs cursor-pointer"
            title="Configure proactive alert thresholds for financials"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
            <span>Set Thresholds</span>
            {activeRulesCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-50 text-indigo-700 font-mono font-bold border border-indigo-200">
                {activeRulesCount}
              </span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
          
          {/* Card 1: Total Cash Inflows */}
          <div className={`lg:col-span-3 bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between transition-all ${getCardBorderClass('inflowusd', totalInflow)}`}>
            <div>
              <div className="flex items-center justify-between gap-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                  Total Cash Inflows
                </p>
                <div className="flex items-center gap-1">
                  {renderThresholdBellButton('inflowusd', totalInflow, 'Cash Inflows')}
                  <MetricTooltip 
                    metricKey="inflowusd" 
                    label="Cash Inflows" 
                    align="right"
                    onOpenFullGuide={onOpenPlaybook}
                  />
                </div>
              </div>
              <h2 className="text-2xl font-black text-emerald-700 font-mono mt-1 flex items-center gap-1">
                <span>${formatNumber(totalInflow)}</span>
                <ArrowUpRight className="h-5 w-5 text-emerald-600" />
              </h2>
              {renderAlertIndicator('inflowusd', totalInflow, 'Cash Inflows', ' $')}
            </div>
            <div className="flex items-center justify-between text-[11px] mt-2 pt-1 border-t border-slate-100 font-medium text-slate-500">
              <span>Collected Sales & Stripe</span>
              <span className="text-emerald-700 font-bold">100% Inflow</span>
            </div>
          </div>

          {/* Card 2: Total Cost Outflows */}
          <div className={`lg:col-span-3 bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between transition-all ${getCardBorderClass('costoutflowusd', totalOutflow)}`}>
            <div>
              <div className="flex items-center justify-between gap-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                  Operational & Cloud Costs
                </p>
                <div className="flex items-center gap-1">
                  {renderThresholdBellButton('costoutflowusd', totalOutflow, 'Cost Outflows')}
                  <MetricTooltip 
                    metricKey="costoutflowusd" 
                    label="Cost Outflows" 
                    align="right"
                    onOpenFullGuide={onOpenPlaybook}
                  />
                </div>
              </div>
              <h2 className="text-2xl font-black text-rose-600 font-mono mt-1 flex items-center gap-1">
                <span>-${formatNumber(totalOutflow)}</span>
                <ArrowDownRight className="h-5 w-5 text-rose-600" />
              </h2>
              {renderAlertIndicator('costoutflowusd', totalOutflow, 'Cost Outflows', ' $')}
            </div>
            <div className="flex items-center justify-between text-[11px] mt-2 pt-1 border-t border-slate-100 font-medium text-slate-500">
              <span>Infra, Tokens & SaaS</span>
              <span className="text-slate-700 font-bold">COGS {(totalInflow > 0 ? ((totalOutflow / totalInflow) * 100).toFixed(1) : 0)}%</span>
            </div>
          </div>

          {/* Card 3: Net Cash Flow */}
          <div className={`lg:col-span-3 bg-white p-4 rounded-lg border border-emerald-200 bg-linear-to-br from-white to-emerald-50/40 shadow-xs flex flex-col justify-between transition-all ${getCardBorderClass('netcashimpact', netCash)}`}>
            <div>
              <div className="flex items-center justify-between gap-1">
                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest truncate">
                  Net Cash Flow
                </p>
                <div className="flex items-center gap-1">
                  {renderThresholdBellButton('netcashimpact', netCash, 'Net Cash Flow')}
                  <MetricTooltip 
                    metricKey="netcashimpact" 
                    label="Net Cash Flow" 
                    align="right"
                    onOpenFullGuide={onOpenPlaybook}
                  />
                </div>
              </div>
              <h2 className="text-2xl font-black text-emerald-900 font-mono mt-1">
                +${formatNumber(netCash)}
              </h2>
              {renderAlertIndicator('netcashimpact', netCash, 'Net Cash Flow', ' $')}
            </div>
            <div className="flex items-center justify-between text-[11px] mt-2 pt-1 border-t border-emerald-100 font-medium text-emerald-800">
              <span>Cash Flow Margin</span>
              <span className="font-bold font-mono">{(totalInflow > 0 ? (((totalInflow - totalOutflow) / totalInflow) * 100).toFixed(1) : 0)}%</span>
            </div>
          </div>

          {/* Card 4: Active Customer Trials & Due Invoices */}
          <div className={`lg:col-span-3 bg-indigo-900 p-4 rounded-lg text-white shadow-md flex flex-col justify-between transition-all ${getCardBorderClass('urgent_due', urgentDue)}`}>
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest">
                  Trials & Payables Radar
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openThresholdModalFor('urgent_due')}
                    className="p-1 rounded text-indigo-200 hover:text-white transition-colors cursor-pointer"
                    title="Set alert threshold for due bills"
                  >
                    <Bell className="h-3.5 w-3.5" />
                  </button>
                  <MetricTooltip 
                    metricKey="trialdaysleft" 
                    label="Trials & Due Dates" 
                    align="left"
                    onOpenFullGuide={onOpenPlaybook}
                  />
                </div>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <div>
                  <span className="text-[10px] text-indigo-200 font-medium block">Trial Pipeline:</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">
                    ${formatNumber(trialPipeline)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-indigo-200 font-medium block">Due in 7 Days:</span>
                  <span className="text-xl font-black text-amber-300 font-mono">
                    {urgentDue} Bills
                  </span>
                </div>
              </div>
              {renderAlertIndicator('urgent_due', urgentDue, 'Urgent Due Invoices', ' bills')}
            </div>
            <div className="mt-2 pt-1 border-t border-white/20 flex items-center justify-between text-[10px] text-indigo-200">
              <span>{trials.length} Active Pilots</span>
              <span className="font-bold text-white">Payment Terms Tracked</span>
            </div>
          </div>

        </div>

        {/* Threshold Configuration Modal */}
        <MetricThresholdModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          availableMetrics={availableMetrics}
          selectedMetricKey={selectedModalMetricKey}
          thresholds={thresholds}
          onSaveThreshold={handleSaveThreshold}
          onDeleteThreshold={handleDeleteThreshold}
          onResetDefaults={handleResetDefaults}
        />
      </div>
    );
  }

  // --- Generic / Dynamic Metrics Archetype ---
  const hasHitl = schema.some(c => /hitl|human|override/i.test(c.key));
  const hasSteps = schema.some(c => /step/i.test(c.key));
  const hasRuns = schema.some(c => /totalrun|runs|execution/i.test(c.key));

  const hitlCol = schema.find(c => /hitl|human|override/i.test(c.key));
  const stepCol = schema.find(c => /step/i.test(c.key));
  const runCol = schema.find(c => /totalrun|runs|execution/i.test(c.key));

  let totalHitl = 0;
  let totalRuns = 0;
  let avgSteps = 0;

  if (hasHitl && hitlCol) {
    totalHitl = data.reduce((acc, row) => acc + (Number(row[hitlCol.key]) || 0), 0);
  }
  if (hasRuns && runCol) {
    totalRuns = data.reduce((acc, row) => acc + (Number(row[runCol.key]) || 0), 0);
  }
  if (hasSteps && stepCol) {
    const stepVals = data.map(r => Number(r[stepCol.key])).filter(v => !isNaN(v));
    avgSteps = stepVals.length ? Number((stepVals.reduce((a, b) => a + b, 0) / stepVals.length).toFixed(1)) : 0;
  }

  const autonomousRate = totalRuns > 0 
    ? parseFloat(((1 - (totalHitl / totalRuns)) * 100).toFixed(1)) 
    : 96.8;

  const displayedKpis = kpis.slice(0, (hasHitl || hasSteps) ? 2 : 3);

  const availableMetrics: AvailableMetricInfo[] = [
    { key: 'dataset_records', label: 'Dataset Records', currentValue: data.length, unit: 'records', suggestedCondition: 'less_than' },
    ...displayedKpis.map(k => ({
      key: k.key,
      label: `Total ${k.label}`,
      currentValue: k.sum,
      suggestedCondition: 'greater_than' as const,
    })),
    ...(hasHitl || hasSteps ? [
      { key: 'autonomous_rate', label: 'Autonomy Rate', currentValue: autonomousRate, unit: '%', suggestedCondition: 'less_than' as const },
      { key: 'hitl_overrides', label: 'HITL Overrides', currentValue: totalHitl, unit: 'overrides', suggestedCondition: 'greater_than' as const }
    ] : [])
  ];

  const triggeredAlertsCount = availableMetrics.filter(m => evaluateAlert(m.key, m.currentValue).isTriggered).length;
  const activeRulesCount = (Object.values(thresholds) as MetricAlertThreshold[]).filter(t => t.enabled).length;

  return (
    <div className="space-y-3">
      {/* Row Header with Alert Threshold Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Operational KPI Metrics
          </span>
          {triggeredAlertsCount > 0 ? (
            <button
              onClick={() => openThresholdModalFor()}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-colors cursor-pointer"
            >
              <AlertTriangle className="h-3 w-3 text-amber-700" />
              {triggeredAlertsCount} Alert{triggeredAlertsCount > 1 ? 's' : ''} Triggered
            </button>
          ) : (
            <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              Metrics In Target Range
            </span>
          )}
        </div>

        <button
          onClick={() => openThresholdModalFor()}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-indigo-600 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-md px-2.5 py-1 transition-colors shadow-2xs cursor-pointer"
          title="Configure proactive alert thresholds for metrics"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
          <span>Set Thresholds</span>
          {activeRulesCount > 0 && (
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-50 text-indigo-700 font-mono font-bold border border-indigo-200">
              {activeRulesCount}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
        
        {/* Metric 1: Total Records */}
        <div className={`lg:col-span-3 bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between transition-all ${getCardBorderClass('dataset_records', data.length)}`}>
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Dataset Records
              </p>
              {renderThresholdBellButton('dataset_records', data.length, 'Dataset Records')}
            </div>
            <h2 className="text-2xl font-black text-slate-900 mt-1">
              {data.length.toLocaleString()}
            </h2>
            {renderAlertIndicator('dataset_records', data.length, 'Dataset Records', ' records')}
          </div>
          <div className="text-emerald-600 text-xs font-bold flex items-center gap-1 mt-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Filtered Active Scope</span>
          </div>
        </div>

        {/* Dynamic Metric Cards */}
        {displayedKpis.map((kpi, idx) => {
          const hasDelta = kpi.latestDelta !== undefined;
          const isPositive = (kpi.latestDelta || 0) >= 0;

          return (
            <div 
              key={`${kpi.key}-${idx}`} 
              className={`lg:col-span-3 bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between transition-all ${getCardBorderClass(kpi.key, kpi.sum)}`}
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate" title={kpi.label}>
                    Total {kpi.label}
                  </p>
                  <div className="flex items-center gap-1">
                    {renderThresholdBellButton(kpi.key, kpi.sum, kpi.label)}
                    <MetricTooltip 
                      metricKey={kpi.key} 
                      label={kpi.label} 
                      align="right"
                      onOpenFullGuide={onOpenPlaybook}
                    />
                  </div>
                </div>
                <h2 className="text-2xl font-black text-slate-900 mt-1">
                  {formatNumber(kpi.sum)}
                </h2>
                {renderAlertIndicator(kpi.key, kpi.sum, kpi.label)}
              </div>
              
              <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100/80">
                <div className="text-[11px] font-medium text-slate-500">
                  Avg <span className="font-bold text-slate-700">{formatNumber(kpi.avg)}</span>
                </div>
                {hasDelta ? (
                  <div
                    className={`text-xs font-bold flex items-center gap-0.5 ${
                      isPositive ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {isPositive ? '↑' : '↓'} {Math.abs(kpi.latestDelta!)}%
                    <span className="text-[10px] text-slate-400 font-normal ml-0.5">delta</span>
                  </div>
                ) : (
                  <div className="text-xs font-bold text-indigo-600">
                    Max: {formatNumber(kpi.max)}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Specialized Effectiveness Card when HITL or Step metrics are detected */}
        {(hasHitl || hasSteps) ? (
          <div className={`lg:col-span-3 bg-white p-4 rounded-lg border border-indigo-200 bg-linear-to-br from-white to-indigo-50/40 shadow-xs flex flex-col justify-between transition-all ${getCardBorderClass('autonomous_rate', autonomousRate)}`}>
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                    Autonomy & Steps
                  </p>
                  <MetricTooltip 
                    metricKey="hitloverrides" 
                    label="Autonomy & Overrides"
                    align="left"
                    onOpenFullGuide={onOpenPlaybook}
                  />
                </div>
                <div className="flex items-center gap-1">
                  {renderThresholdBellButton('autonomous_rate', autonomousRate, 'Autonomy Rate')}
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {autonomousRate}%
                  </span>
                </div>
              </div>
              <div className="flex items-baseline gap-3 mt-1">
                <div>
                  <span className="text-xs text-slate-500 font-medium">Avg Steps: </span>
                  <span className="text-xl font-black text-slate-900">{avgSteps}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium">HITL: </span>
                  <span className="text-xl font-black text-rose-600">{totalHitl}</span>
                </div>
              </div>
              {renderAlertIndicator('autonomous_rate', autonomousRate, 'Autonomy Rate', '%')}
            </div>
            <div className="mt-2 pt-1.5 border-t border-indigo-100 flex items-center justify-between text-[11px] text-slate-600">
              <span className="flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
                HITL Override Rate
              </span>
              <span className="font-bold text-slate-800">
                {totalRuns > 0 ? ((totalHitl / totalRuns) * 100).toFixed(2) : 0}%
              </span>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-3 bg-indigo-900 p-4 rounded-lg text-white shadow-md flex flex-col justify-between">
            <div>
              <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest">
                Analysis Engine
              </p>
              <h4 className="text-lg font-black tracking-tight text-white mt-0.5">
                Geometric Balance
              </h4>
            </div>
            <div className="mt-2">
              <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden mb-1.5">
                <div className="w-3/4 h-full bg-indigo-400 rounded-full"></div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-indigo-200 font-medium">
                <span>Aggregations Sync</span>
                <span className="font-bold text-white">100% Optimal</span>
              </div>
            </div>
          </div>
        )}

        {/* System Telemetry Card */}
        {(hasHitl || hasSteps) && (
          <div className="lg:col-span-3 bg-indigo-900 p-4 rounded-lg text-white shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest">
                  Effectiveness Index
                </p>
                {onOpenPlaybook && (
                  <button
                    type="button"
                    onClick={() => onOpenPlaybook('hitloverrides')}
                    className="text-[10px] text-indigo-300 hover:text-white flex items-center gap-1 font-bold underline cursor-pointer"
                    title="Open Metric Interpretation Guide"
                  >
                    <BookOpen className="h-3 w-3" />
                    Guide
                  </button>
                )}
              </div>
              <h4 className="text-lg font-black tracking-tight text-white mt-0.5">
                Workflow Health
              </h4>
            </div>
            <div className="mt-2">
              <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden mb-1.5">
                <div 
                  className="h-full bg-emerald-400 rounded-full" 
                  style={{ width: `${Math.min(100, Math.max(10, autonomousRate))}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-indigo-200 font-medium">
                <span>Autonomous Resolution</span>
                <span className="font-bold text-emerald-300">{autonomousRate}%</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Threshold Configuration Modal */}
      <MetricThresholdModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        availableMetrics={availableMetrics}
        selectedMetricKey={selectedModalMetricKey}
        thresholds={thresholds}
        onSaveThreshold={handleSaveThreshold}
        onDeleteThreshold={handleDeleteThreshold}
        onResetDefaults={handleResetDefaults}
      />
    </div>
  );
};
