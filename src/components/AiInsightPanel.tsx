import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  Filter,
  Layers,
  ArrowRight,
  ShieldCheck,
  Info,
  Zap,
  Clock,
  RotateCcw
} from 'lucide-react';
import { Dataset, FilterState } from '../types';
import { computeKpis, formatNumber } from '../utils/dataProcessing';

interface InsightData {
  summary: string;
  trend: string;
  anomaly: string;
  action: string;
  status: 'stable' | 'attention_needed' | 'critical';
}

interface Props {
  dataset: Dataset;
  filteredData: Record<string, any>[];
  filters: FilterState;
  onOpenPlaybook?: () => void;
}

interface RetryState {
  attempt: number;
  maxRetries: number;
  delayMs: number;
  remainingMs: number;
  reason: string;
}

// Exponential backoff configuration
const MAX_BACKOFF_RETRIES = 3;
const BASE_DELAY_MS = 1200;
const BACKOFF_MULTIPLIER = 2;
const MAX_DELAY_MS = 8000;
const JITTER_MAX_MS = 300;

function calculateExponentialBackoff(attempt: number): number {
  const exp = BASE_DELAY_MS * Math.pow(BACKOFF_MULTIPLIER, Math.max(0, attempt - 1));
  const jitter = Math.floor(Math.random() * JITTER_MAX_MS);
  return Math.min(exp + jitter, MAX_DELAY_MS);
}

export const AiInsightPanel: React.FC<Props> = ({
  dataset,
  filteredData,
  filters,
  onOpenPlaybook,
}) => {
  const [insight, setInsight] = useState<InsightData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [source, setSource] = useState<string>('gemini');
  const [model, setModel] = useState<string>('gemini-3.8-flash');
  const [focusTab, setFocusTab] = useState<'all' | 'trends' | 'anomalies' | 'actionable'>('all');
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastAnalyzedSignature, setLastAnalyzedSignature] = useState<string>('');
  const [retryState, setRetryState] = useState<RetryState | null>(null);

  const clientCacheRef = useRef<Map<string, { insight: InsightData; source: string; model: string; notice: string | null }>>(new Map());
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearRetryTimers = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setRetryState(null);
  }, []);

  // Teardown timers on unmount
  useEffect(() => {
    return () => {
      clearRetryTimers();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [clearRetryTimers]);

  // Compute active filters summary description
  const activeFiltersSummary = useMemo(() => {
    const parts: string[] = [];
    if (filters.searchQuery?.trim()) {
      parts.push(`Query: "${filters.searchQuery.trim()}"`);
    }
    Object.entries(filters.categoryFilters || {}).forEach(([k, vals]) => {
      if (Array.isArray(vals) && vals.length > 0) {
        parts.push(`${k}: ${vals.join(', ')}`);
      }
    });
    Object.entries(filters.numericRanges || {}).forEach(([k, range]) => {
      if (Array.isArray(range) && range.length === 2) {
        parts.push(`${k} [${range[0]} - ${range[1]}]`);
      }
    });
    return parts.length > 0 ? parts.join(' | ') : 'No filters applied (Full view)';
  }, [filters]);

  // Current view signature to detect when data changes
  const currentSignature = useMemo(() => {
    return `${dataset.id}-${filteredData.length}-${activeFiltersSummary}-${focusTab}`;
  }, [dataset.id, filteredData.length, activeFiltersSummary, focusTab]);

  const fetchAiInsight = useCallback(async (
    forcedFocus?: 'all' | 'trends' | 'anomalies' | 'actionable',
    attempt: number = 0,
    forceRefresh: boolean = false
  ) => {
    clearRetryTimers();
    const activeFocus = forcedFocus || focusTab;
    const cacheKey = `${currentSignature}-${activeFocus}`;

    // Instant return from client cache if available and not explicitly force-refreshed
    if (!forceRefresh && attempt === 0 && clientCacheRef.current.has(cacheKey)) {
      const cached = clientCacheRef.current.get(cacheKey)!;
      setInsight(cached.insight);
      setSource(cached.source);
      setModel(cached.model);
      setNotice(cached.notice);
      setLastAnalyzedSignature(currentSignature);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    // Abort previous in-flight request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const computedKpis = computeKpis(filteredData, dataset.schema);
    const kpiMap: Record<string, any> = {};
    computedKpis.slice(0, 8).forEach(k => {
      kpiMap[k.label] = `Sum: ${formatNumber(k.sum)}, Avg: ${formatNumber(k.avg)}`;
    });

    const isFinal = attempt >= MAX_BACKOFF_RETRIES;

    try {
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          datasetName: dataset.name,
          datasetId: dataset.id,
          rowCount: filteredData.length,
          totalRowCount: dataset.data.length,
          filtersApplied: {
            summary: activeFiltersSummary,
            search: filters.searchQuery,
            categories: filters.categoryFilters,
          },
          kpis: kpiMap,
          sampleRows: filteredData.slice(0, 25),
          focus: activeFocus,
          attempt,
          isFinalAttempt: isFinal,
          forceRefresh,
        }),
      });

      let result: any = null;
      try {
        result = await response.json();
      } catch {
        // Handle non-JSON responses
      }

      // Genuine 503 High Demand triggers exponential backoff; 429 quota is handled gracefully by server
      const is503 = response.status === 503 || result?.error?.code === 503 || result?.error?.status === 'UNAVAILABLE';

      // If 503 unavailable detected and we have retries remaining, initiate exponential backoff
      if (is503 && attempt < MAX_BACKOFF_RETRIES) {
        const nextAttempt = attempt + 1;
        const delay = calculateExponentialBackoff(nextAttempt);
        const reasonText =
          result?.error?.message || 'Gemini model is currently experiencing high demand (503 Unavailable)';

        console.info(
          `[AiInsightPanel] High demand 503 detected on attempt ${attempt}. Retrying ${nextAttempt}/${MAX_BACKOFF_RETRIES} in ${delay}ms...`
        );

        const startTime = Date.now();
        setRetryState({
          attempt: nextAttempt,
          maxRetries: MAX_BACKOFF_RETRIES,
          delayMs: delay,
          remainingMs: delay,
          reason: reasonText,
        });

        // Interval for smooth timer countdown display
        countdownIntervalRef.current = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, delay - elapsed);
          setRetryState(prev => (prev ? { ...prev, remainingMs: remaining } : null));
        }, 100);

        // Schedule next attempt with exponential delay
        retryTimeoutRef.current = setTimeout(() => {
          clearRetryTimers();
          fetchAiInsight(activeFocus, nextAttempt, forceRefresh);
        }, delay);

        setIsLoading(false);
        return;
      }

      // Successful result or graceful final-attempt fallback
      if (result && result.success && result.data) {
        clearRetryTimers();
        setInsight(result.data);
        setSource(result.source || 'gemini');
        setModel(result.model || 'gemini-3.8-flash');
        setNotice(result.notice || null);
        setLastAnalyzedSignature(currentSignature);
        clientCacheRef.current.set(cacheKey, {
          insight: result.data,
          source: result.source || 'gemini',
          model: result.model || 'gemini-3.8-flash',
          notice: result.notice || null,
        });
      } else if (result?.error) {
        throw new Error(result.error.message || `Server returned error (${response.status})`);
      } else if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      } else {
        throw new Error('Unable to parse AI response');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }
      console.info('[AiInsightPanel] Request status:', err.message || err);
      clearRetryTimers();
      setErrorMsg(err.message || 'Failed to connect to AI Insight Engine');
    } finally {
      setIsLoading(false);
    }
  }, [dataset, filteredData, filters, activeFiltersSummary, focusTab, currentSignature, clearRetryTimers]);

  // Initial fetch on dataset change
  useEffect(() => {
    clearRetryTimers();
    fetchAiInsight();
  }, [dataset.id]);

  const isStale = lastAnalyzedSignature !== '' && lastAnalyzedSignature !== currentSignature;

  const handleCopy = () => {
    if (!insight) return;
    const textToCopy = `[${dataset.name} AI Executive Insight]
Summary: ${insight.summary}
Trend: ${insight.trend}
Anomaly: ${insight.anomaly}
Action Item: ${insight.action}
Status: ${insight.status.toUpperCase()}
Generated by: ${source === 'gemini' ? `Gemini (${model})` : 'Founder Analytics Engine'} (${filteredData.length} records analyzed)`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const statusBadge = useMemo(() => {
    const status = insight?.status || 'stable';
    if (status === 'critical') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
          <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
          Critical Alert
        </span>
      );
    }
    if (status === 'attention_needed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
          Attention Recommended
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
        Healthy Trajectory
      </span>
    );
  }, [insight?.status]);

  return (
    <div 
      id="ai-insight-panel"
      className="bg-white rounded-lg border border-slate-200/90 shadow-xs overflow-hidden transition-all duration-200"
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50/70 border-b border-slate-200">
        
        {/* Left: Identity & Context */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded bg-indigo-600 text-white shadow-2xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                AI Insight &amp; Trend Engine
              </h3>
              <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold border ${
                source === 'gemini'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                <BrainCircuit className="h-3 w-3 text-indigo-600" />
                {source === 'gemini'
                  ? (model.includes('lite') ? 'Gemini Flash-Lite' : 'Gemini 3.8 Flash')
                  : 'Deterministic Metric Engine'}
              </span>
              {insight && statusBadge}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Real-time analysis on <strong className="text-slate-700">{filteredData.length}</strong> of {dataset.data.length} records in <strong className="text-slate-700">{dataset.name}</strong>
            </p>
          </div>
        </div>

        {/* Right: Actions & Controls */}
        <div className="flex items-center gap-2">
          {/* Stale view alert indicator */}
          {isStale && !isLoading && !retryState && (
            <button
              onClick={() => fetchAiInsight(undefined, 0, true)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded px-2 py-1 cursor-pointer transition-colors"
              title="Filters have changed since last analysis. Click to recalculate."
            >
              <RefreshCw className="h-3 w-3 animate-spin text-amber-700" />
              <span>Filters Changed &bull; Refresh</span>
            </button>
          )}

          {/* Regenerate Button */}
          <button
            id="btn-refresh-ai-insight"
            onClick={() => fetchAiInsight(undefined, 0, true)}
            disabled={isLoading || !!retryState}
            className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-indigo-600 hover:border-slate-400 disabled:opacity-50 cursor-pointer transition-colors"
            title="Re-analyze current filtered dataset"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
            <span>{isLoading ? 'Analyzing...' : 'Re-analyze'}</span>
          </button>

          {/* Copy Button */}
          {insight && (
            <button
              id="btn-copy-ai-insight"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 cursor-pointer transition-colors"
              title="Copy executive brief to clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                  <span>Copy Brief</span>
                </>
              )}
            </button>
          )}

          {/* Expand / Minimize Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
            title={isExpanded ? 'Collapse panel' : 'Expand panel'}
            aria-label={isExpanded ? 'Collapse AI panel' : 'Expand AI panel'}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content Area */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          
          {/* Focus Dimension Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Analysis Lens:
              </span>
              {(['all', 'trends', 'anomalies', 'actionable'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => {
                    setFocusTab(tab);
                    fetchAiInsight(tab);
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded transition-colors cursor-pointer ${
                    focusTab === tab
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab === 'all' && 'All Insights'}
                  {tab === 'trends' && 'Key Trends'}
                  {tab === 'anomalies' && 'Anomalies & Outliers'}
                  {tab === 'actionable' && 'Action Plan'}
                </button>
              ))}
            </div>

            {/* Filter context hint */}
            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
              <Filter className="h-3 w-3 text-slate-400" />
              <span className="truncate max-w-xs">{activeFiltersSummary}</span>
            </div>
          </div>

          {/* Exponential Backoff Retry Card (Graceful 503 Handling) */}
          {retryState && (
            <div
              id="gemini-exponential-backoff-card"
              className="rounded-lg border border-amber-300 bg-linear-to-r from-amber-50 to-orange-50/60 p-3.5 shadow-2xs transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                    <RefreshCw className="h-5 w-5 animate-spin text-amber-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                        High Demand (503 Unavailable) &bull; Exponential Backoff Active
                      </h4>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300">
                        Retry {retryState.attempt} of {retryState.maxRetries}
                      </span>
                    </div>
                    <p className="text-xs text-amber-900 mt-1 font-medium">
                      Gemini model is experiencing temporary traffic spikes. Retrying in{' '}
                      <strong className="font-bold font-mono text-amber-950">
                        {(retryState.remainingMs / 1000).toFixed(1)}s
                      </strong>{' '}
                      with exponential jitter.
                    </p>

                    {/* Visual Progression Ladder */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                      <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider mr-1">
                        Backoff Ladder:
                      </span>
                      {[1, 2, 3].map(step => {
                        const isCurrent = retryState.attempt === step;
                        const isCompleted = step < retryState.attempt;
                        return (
                          <span
                            key={step}
                            className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold transition-all ${
                              isCurrent
                                ? 'bg-amber-600 text-white shadow-2xs ring-2 ring-amber-300 scale-105'
                                : isCompleted
                                ? 'bg-amber-200/80 text-amber-900 line-through opacity-75'
                                : 'bg-white/80 text-slate-500 border border-amber-200'
                            }`}
                          >
                            Attempt {step}: ~{Math.round(calculateExponentialBackoff(step) / 1000)}s
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Manual Immediate Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      clearRetryTimers();
                      fetchAiInsight(focusTab, retryState.attempt);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 cursor-pointer shadow-2xs transition-colors"
                    title="Bypass remaining delay and retry right now"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    <span>Retry Now</span>
                  </button>
                  <button
                    onClick={() => {
                      clearRetryTimers();
                      fetchAiInsight(focusTab, MAX_BACKOFF_RETRIES);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold bg-white text-slate-700 border border-amber-300 hover:bg-amber-50 cursor-pointer shadow-2xs transition-colors"
                    title="Bypass retry wait and immediately display local dataset analytics"
                  >
                    <span>Use Local Analytics</span>
                  </button>
                </div>
              </div>

              {/* Animated Progress Bar */}
              <div className="w-full bg-amber-200/80 h-1.5 rounded-full overflow-hidden mt-3">
                <div
                  className="bg-amber-600 h-full transition-all duration-100 ease-linear rounded-full"
                  style={{
                    width: `${Math.max(0, Math.min(100, (1 - retryState.remainingMs / retryState.delayMs) * 100))}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading && !retryState && (
            <div className="py-6 flex flex-col items-center justify-center gap-2 text-slate-500">
              <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Analyzing {filteredData.length} records with Gemini Analytics Engine...
              </p>
              <p className="text-[11px] text-slate-400 font-medium">
                Evaluating trajectories, statistical anomalies, and tactical levers
              </p>
            </div>
          )}

          {/* Error Message if any */}
          {errorMsg && !isLoading && !retryState && (
            <div className="rounded border border-rose-200 bg-rose-50/70 p-3 flex items-start gap-2.5 text-xs text-rose-900">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Analysis Notice</p>
                <p className="mt-0.5">{errorMsg}</p>
                <button
                  onClick={() => fetchAiInsight(undefined, 0, true)}
                  className="mt-2 text-indigo-700 hover:text-indigo-900 underline font-bold cursor-pointer"
                >
                  Retry analysis
                </button>
              </div>
            </div>
          )}

          {/* Notice banner if model was on high demand or fallback occurred */}
          {notice && !isLoading && !retryState && (
            <div className="rounded border border-amber-200 bg-amber-50/70 p-2.5 flex items-center justify-between gap-2 text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-amber-700 shrink-0" />
                <span>{notice}</span>
              </div>
              <button
                onClick={() => fetchAiInsight(undefined, 0, true)}
                className="text-xs font-bold text-amber-900 hover:text-indigo-800 underline shrink-0 cursor-pointer"
              >
                Re-analyze
              </button>
            </div>
          )}

          {/* The Primary 2-3 Sentence Executive Summary */}
          {!isLoading && insight && !retryState && (
            <>
              <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-3.5">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded bg-indigo-100/80 text-indigo-800 shrink-0 mt-0.5">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-indigo-900 uppercase tracking-widest mb-1">
                      Executive Summary (2-3 Sentences)
                    </h4>
                    <p className="text-sm font-medium text-slate-800 leading-relaxed">
                      {insight.summary}
                    </p>
                  </div>
                </div>
              </div>

              {/* Three Pill Callout Cards (Trend, Anomaly, Action) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                
                {/* 1. Dominant Trend */}
                <div className="rounded border border-slate-200 bg-slate-50/60 p-3 flex flex-col justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs mb-1.5">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      <span className="uppercase tracking-wider text-[10px]">Identified Trend</span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-normal">
                      {insight.trend}
                    </p>
                  </div>
                </div>

                {/* 2. Anomaly / Outlier / Risk */}
                <div className="rounded border border-amber-200 bg-amber-50/40 p-3 flex flex-col justify-between hover:bg-amber-50/60 transition-colors">
                  <div>
                    <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs mb-1.5">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span className="uppercase tracking-wider text-[10px]">Notable Anomaly or Risk</span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-normal">
                      {insight.anomaly}
                    </p>
                  </div>
                </div>

                {/* 3. Actionable Tactical Advice */}
                <div className="rounded border border-indigo-200 bg-indigo-50/40 p-3 flex flex-col justify-between hover:bg-indigo-50/60 transition-colors">
                  <div>
                    <div className="flex items-center gap-1.5 text-indigo-800 font-bold text-xs mb-1.5">
                      <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                      <span className="uppercase tracking-wider text-[10px]">Actionable Advice</span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-normal">
                      {insight.action}
                    </p>
                  </div>
                </div>

              </div>

              {/* Footer / Metric Playbook link */}
              {onOpenPlaybook && (
                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 border-t border-slate-100">
                  <span className="font-medium">
                    Analysis grounded on active telemetry &amp; filtered dimension thresholds.
                  </span>
                  <button
                    onClick={onOpenPlaybook}
                    className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    <span>View Metric Interpretation Rules</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      )}
    </div>
  );
};

