import React, { useState, useMemo } from 'react';
import { 
  Settings, 
  Maximize2, 
  Minimize2, 
  Trash2, 
  Copy, 
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import { ChartConfig, ChartType, ColumnSchema } from '../types';
import { aggregateData, formatNumber } from '../utils/dataProcessing';
import { generateForecast } from '../utils/forecasting';

import { BarChartComponent } from './charts/BarChartComponent';
import { LineChartComponent } from './charts/LineChartComponent';
import { AreaChartComponent } from './charts/AreaChartComponent';
import { PieChartComponent } from './charts/PieChartComponent';
import { ScatterChartComponent } from './charts/ScatterChartComponent';
import { RadarChartComponent } from './charts/RadarChartComponent';
import { ComposedChartComponent } from './charts/ComposedChartComponent';
import { HeatmapMatrixComponent } from './charts/HeatmapMatrixComponent';
import { CorrelationMatrixComponent } from './charts/CorrelationMatrixComponent';
import { ForecastingChartComponent } from './charts/ForecastingChartComponent';
import { MetricTooltip } from './MetricTooltip';

interface Props {
  config: ChartConfig;
  data: Record<string, any>[];
  schema: ColumnSchema[];
  onEdit: (config: ChartConfig) => void;
  onDuplicate: (config: ChartConfig) => void;
  onDelete: (id: string) => void;
  onUpdateConfig: (updated: ChartConfig) => void;
  onOpenPlaybook?: (metricKey?: string) => void;
}

export const ChartCard: React.FC<Props> = ({
  config,
  data,
  schema,
  onEdit,
  onDuplicate,
  onDelete,
  onUpdateConfig,
  onOpenPlaybook,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isForecasting, setIsForecasting] = useState<boolean>(config.forecastingEnabled ?? false);
  const [forecastDays, setForecastDays] = useState<number>(config.forecastDays ?? 30);
  const [showConfidenceInterval, setShowConfidenceInterval] = useState<boolean>(true);

  // Process data for this chart
  const processedData = useMemo(() => {
    if (config.type === 'heatmap' || config.type === 'correlation') {
      return data;
    }
    return aggregateData(
      data,
      config.xAxisKey,
      config.yAxisKeys,
      config.aggregation,
      config.sortBy,
      config.limit
    );
  }, [data, config.xAxisKey, config.yAxisKeys, config.aggregation, config.sortBy, config.limit, config.type]);

  // Compute 30-day linear regression projection if forecasting is enabled
  const forecastResult = useMemo(() => {
    if (!isForecasting || config.type === 'heatmap' || config.type === 'correlation') {
      return null;
    }
    return generateForecast(processedData, config.xAxisKey, config.yAxisKeys, forecastDays);
  }, [isForecasting, processedData, config.xAxisKey, config.yAxisKeys, forecastDays, config.type]);

  const handleToggleForecasting = () => {
    const nextVal = !isForecasting;
    setIsForecasting(nextVal);
    onUpdateConfig({
      ...config,
      forecastingEnabled: nextVal,
      forecastDays,
    });
  };

  const primaryMetricStats = forecastResult && forecastResult.primaryMetricKey
    ? forecastResult.metrics[forecastResult.primaryMetricKey]
    : null;

  const numericCols = schema.filter(s => s.type === 'number');

  // Quick type switcher
  const handleQuickTypeChange = (newType: ChartType) => {
    onUpdateConfig({
      ...config,
      type: newType,
    });
  };

  const renderChartBody = () => {
    // If in forecasting mode and we have valid forecast results, render the predictive forecast chart
    if (isForecasting && forecastResult && forecastResult.combinedData.length > 0) {
      return (
        <ForecastingChartComponent
          forecastResult={forecastResult}
          config={config}
          showConfidenceInterval={showConfidenceInterval}
        />
      );
    }

    switch (config.type) {
      case 'bar':
      case 'horizontal-bar':
      case 'stacked-bar':
        return <BarChartComponent data={processedData} config={config} />;
      case 'line':
        return <LineChartComponent data={processedData} config={config} />;
      case 'area':
      case 'stacked-area':
        return <AreaChartComponent data={processedData} config={config} />;
      case 'pie':
      case 'donut':
        return <PieChartComponent data={processedData} config={config} />;
      case 'scatter':
        return <ScatterChartComponent data={processedData} config={config} />;
      case 'radar':
        return <RadarChartComponent data={processedData} config={config} />;
      case 'composed':
        return <ComposedChartComponent data={processedData} config={config} />;
      case 'heatmap':
        return <HeatmapMatrixComponent data={data} config={config} />;
      case 'correlation':
        return <CorrelationMatrixComponent data={data} schema={schema} />;
      default:
        return <BarChartComponent data={processedData} config={config} />;
    }
  };

  return (
    <div
      className={`flex flex-col bg-white rounded-lg border border-slate-200 shadow-sm transition-all ${
        isFullscreen
          ? 'fixed inset-4 z-50 shadow-2xl overflow-hidden'
          : isForecasting
          ? 'h-[475px]'
          : 'h-[430px]'
      }`}
    >
      {/* Geometric Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3.5 bg-slate-50/50">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0"></span>
          <h3 className="text-sm font-bold text-slate-800 truncate" title={config.title}>
            {config.title}
          </h3>
          <span className="rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-700 uppercase tracking-wider shrink-0">
            {config.type.replace('-', ' ')}
          </span>
          <MetricTooltip 
            metricKey={config.yAxisKeys[0] || config.xAxisKey || config.title} 
            label={config.title}
            align="left"
            onOpenFullGuide={onOpenPlaybook}
          />
        </div>

        {/* Quick Actions & Type Selectors */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Predictive Forecasting Mode Toggle */}
          {config.type !== 'heatmap' && config.type !== 'correlation' && (
            <button
              onClick={handleToggleForecasting}
              className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                isForecasting
                  ? 'bg-indigo-600 text-white shadow-xs hover:bg-indigo-700'
                  : 'border border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'
              }`}
              title={
                isForecasting
                  ? 'Exit Predictive Forecasting Mode'
                  : 'Enable 30-Day Predictive Linear Regression Forecasting'
              }
            >
              <TrendingUp className={`h-3.5 w-3.5 ${isForecasting ? 'text-white' : 'text-indigo-600'}`} />
              <span>{isForecasting ? 'Forecasting Active' : 'Forecast (30d)'}</span>
              {isForecasting && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              )}
            </button>
          )}

          {/* Quick Chart Type Picker */}
          <select
            value={config.type}
            onChange={e => handleQuickTypeChange(e.target.value as ChartType)}
            className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 focus:border-indigo-600 focus:outline-hidden cursor-pointer"
            title="Switch Chart Type"
          >
            <option value="bar">Bar</option>
            <option value="horizontal-bar">Horiz Bar</option>
            <option value="stacked-bar">Stacked Bar</option>
            <option value="line">Line</option>
            <option value="area">Area</option>
            <option value="stacked-area">Stacked Area</option>
            <option value="donut">Donut</option>
            <option value="pie">Pie</option>
            <option value="composed">Composed (Bar+Line)</option>
            <option value="scatter">Scatter</option>
            <option value="radar">Radar</option>
            <option value="heatmap">Matrix Heatmap</option>
            <option value="correlation">Correlation Grid</option>
          </select>

          {/* Quick Aggregation Toggle (if applicable) */}
          {config.type !== 'heatmap' && config.type !== 'correlation' && config.type !== 'scatter' && (
            <select
              value={config.aggregation}
              onChange={e => onUpdateConfig({ ...config, aggregation: e.target.value as any })}
              className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 focus:border-indigo-600 focus:outline-hidden cursor-pointer hidden sm:block"
              title="Aggregation Function"
            >
              <option value="sum">Sum</option>
              <option value="avg">Avg</option>
              <option value="count">Count</option>
              <option value="max">Max</option>
              <option value="min">Min</option>
            </select>
          )}

          {/* Full Customizer Modal Button */}
          <button
            onClick={() => onEdit(config)}
            className="inline-flex items-center rounded border border-slate-200 bg-white p-1 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors cursor-pointer"
            title="Customize Chart Parameters"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>

          {/* Duplicate Chart */}
          <button
            onClick={() => onDuplicate(config)}
            className="inline-flex items-center rounded border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Duplicate Chart"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>

          {/* Fullscreen Expand/Collapse */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="inline-flex items-center rounded border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>

          {/* Delete Chart */}
          <button
            onClick={() => onDelete(config.id)}
            className="inline-flex items-center rounded border border-slate-200 bg-white p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer"
            title="Remove Chart"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Forecasting Intelligence Header Strip */}
      {isForecasting && forecastResult && (
        <div className="border-b border-indigo-100 bg-slate-50/90 px-5 py-2 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Key 30-Day Predictive Metric */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                <span className="font-semibold text-slate-700">
                  {forecastDays}-Day Outlook:
                </span>
                {primaryMetricStats ? (
                  <span className="font-bold text-slate-900 font-mono">
                    {formatNumber(primaryMetricStats.endValue)}
                  </span>
                ) : null}
              </div>

              {primaryMetricStats && (
                <span
                  className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    primaryMetricStats.trend === 'upward'
                      ? 'bg-emerald-100 text-emerald-800'
                      : primaryMetricStats.trend === 'downward'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {primaryMetricStats.trend === 'upward' ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : primaryMetricStats.trend === 'downward' ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : null}
                  {primaryMetricStats.projectedPercentChange >= 0 ? '+' : ''}
                  {primaryMetricStats.projectedPercentChange.toFixed(1)}%
                </span>
              )}

              {/* Daily Slope / Trajectory */}
              {primaryMetricStats && (
                <div className="text-[11px] text-slate-600 hidden sm:flex items-center gap-1">
                  <span className="text-slate-300">|</span>
                  <span>Daily Pace:</span>
                  <strong className="font-mono text-slate-800">
                    {primaryMetricStats.slope >= 0 ? '+' : ''}
                    {formatNumber(primaryMetricStats.slope)}/day
                  </strong>
                </div>
              )}

              {/* Goodness of Fit & Equation */}
              {primaryMetricStats && (
                <div className="text-[11px] text-slate-600 hidden md:flex items-center gap-1.5">
                  <span className="text-slate-300">|</span>
                  <span className="font-mono text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">
                    {primaryMetricStats.equation}
                  </span>
                  <span className="rounded bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                    R² = {primaryMetricStats.rSquared.toFixed(2)} ({primaryMetricStats.modelQuality})
                  </span>
                </div>
              )}
            </div>

            {/* Horizon Switcher & Confidence Corridor Toggle */}
            <div className="flex items-center gap-2">
              {/* Confidence interval toggle */}
              <button
                onClick={() => setShowConfidenceInterval(!showConfidenceInterval)}
                className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-semibold transition-colors cursor-pointer ${
                  showConfidenceInterval
                    ? 'border-indigo-300 bg-indigo-50/50 text-indigo-700 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-500'
                }`}
                title={showConfidenceInterval ? 'Hide 95% Confidence Corridor' : 'Show 95% Confidence Corridor'}
              >
                {showConfidenceInterval ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                <span>95% Corridor</span>
              </button>

              {/* Horizon Days Selector */}
              <div className="inline-flex rounded border border-slate-200 bg-white p-0.5 text-[10px] font-semibold shadow-2xs">
                {[14, 30, 60].map(days => (
                  <button
                    key={days}
                    onClick={() => {
                      setForecastDays(days);
                      onUpdateConfig({
                        ...config,
                        forecastingEnabled: true,
                        forecastDays: days,
                      });
                    }}
                    className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                      forecastDays === days
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {days}d
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart Canvas Area */}
      <div className="flex-1 p-4 min-h-0 relative">
        {renderChartBody()}
      </div>

      {/* Bottom Metadata Bar */}
      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-2 text-[11px] font-medium text-slate-500 bg-slate-50/30">
        <div className="flex items-center gap-2 truncate">
          <span>X: <strong className="text-slate-700 font-semibold">{config.xAxisKey || 'N/A'}</strong></span>
          <span className="text-slate-300">|</span>
          <span>Y: <strong className="text-slate-700 font-semibold">{config.yAxisKeys.join(', ') || 'N/A'}</strong></span>
          {isForecasting && (
            <>
              <span className="text-slate-300">|</span>
              <span className="text-indigo-600 font-semibold">Linear Regression OLS</span>
            </>
          )}
        </div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {isForecasting
            ? `${processedData.length} historical + ${forecastDays} projected pts`
            : `${processedData.length} data points`}
        </div>
      </div>
    </div>
  );
};

