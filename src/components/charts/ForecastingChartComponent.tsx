import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { ChartConfig } from '../../types';
import { ForecastResult, ForecastPoint } from '../../utils/forecasting';
import { formatNumber } from '../../utils/dataProcessing';

interface Props {
  forecastResult: ForecastResult;
  config: ChartConfig;
  showConfidenceInterval?: boolean;
}

const DEFAULT_PALETTE = ['#4f46e5', '#059669', '#d97706', '#0284c7', '#7c3aed', '#db2777'];

export const ForecastingChartComponent: React.FC<Props> = ({
  forecastResult,
  config,
  showConfidenceInterval = true,
}) => {
  const { combinedData, boundaryLabel, metrics, horizonDays } = forecastResult;
  const palette = config.colorPalette?.length > 0 ? config.colorPalette : DEFAULT_PALETTE;

  if (!combinedData || combinedData.length === 0 || !config.xAxisKey || config.yAxisKeys.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-slate-400">
        Insufficient historical data for linear regression forecasting.
      </div>
    );
  }

  // Calculate intelligent XAxis tick interval so ticks do not overlap
  const totalPoints = combinedData.length;
  const tickInterval = totalPoints > 35 ? Math.ceil(totalPoints / 10) : totalPoints > 15 ? 2 : 0;

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={combinedData}
          margin={{ top: 16, right: 28, left: 16, bottom: 26 }}
        >
          {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}

          <XAxis
            dataKey={config.xAxisKey}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={{ stroke: '#cbd5e1' }}
            interval={tickInterval}
            angle={totalPoints > 12 ? -25 : 0}
            textAnchor={totalPoints > 12 ? 'end' : 'middle'}
          />

          <YAxis
            tickFormatter={(val) => formatNumber(val)}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={{ stroke: '#cbd5e1' }}
          />

          {/* Reference line marking the start of the 30-day forecast */}
          {boundaryLabel && (
            <ReferenceLine
              x={boundaryLabel}
              stroke="#6366f1"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Today (${horizonDays}d Forecast →)`,
                fill: '#4f46e5',
                fontSize: 10,
                position: 'insideTopRight',
                fontWeight: 'bold',
              }}
            />
          )}

          {/* Custom Tooltip */}
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;
              const pointData = payload[0]?.payload as ForecastPoint | undefined;
              const isForecast = pointData?.isForecast ?? false;
              const dayIndex = pointData?.forecastDayIndex;

              return (
                <div className="rounded-lg border border-slate-200 bg-white/95 backdrop-blur-xs p-3 shadow-lg text-xs min-w-[200px] z-50">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5 mb-2">
                    <span className="font-bold text-slate-800">{label}</span>
                    {isForecast ? (
                      <span className="inline-flex items-center gap-1 rounded bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                        Day +{dayIndex} Projected
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                        Historical Actual
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {config.yAxisKeys.map((yKey, i) => {
                      const color = palette[i % palette.length];
                      const histVal = pointData?.[yKey];
                      const forecastVal = pointData?.[`${yKey}_forecast`];
                      const lower = pointData?.[`${yKey}_lower`];
                      const upper = pointData?.[`${yKey}_upper`];
                      const stats = metrics[yKey];

                      return (
                        <div key={yKey} className="space-y-0.5">
                          <div className="flex items-center justify-between gap-2 font-medium">
                            <span className="flex items-center gap-1.5 text-slate-600">
                              <span
                                className="inline-block w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                              {yKey}:
                            </span>
                            <span className="font-bold font-mono text-slate-900">
                              {isForecast
                                ? formatNumber(forecastVal ?? 0)
                                : formatNumber(histVal ?? 0)}
                            </span>
                          </div>

                          {isForecast && showConfidenceInterval && lower !== undefined && upper !== undefined && (
                            <div className="text-[10px] text-slate-400 pl-4 font-mono">
                              95% Band: [{formatNumber(lower)} – {formatNumber(upper)}]
                            </div>
                          )}

                          {isForecast && stats && stats.startValue !== 0 && (
                            <div className="text-[10px] pl-4 font-semibold text-slate-500">
                              Trajectory:{' '}
                              <span
                                className={
                                  stats.trend === 'upward'
                                    ? 'text-emerald-600'
                                    : stats.trend === 'downward'
                                    ? 'text-rose-600'
                                    : 'text-slate-600'
                                }
                              >
                                {stats.slope >= 0 ? '+' : ''}
                                {formatNumber(stats.slope)}/day
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }}
          />

          {config.showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: 8, fontSize: '11px' }}
              formatter={(value) => <span className="text-slate-600 font-medium">{value}</span>}
            />
          )}

          {/* Render Confidence Interval Area for primary metric if requested */}
          {showConfidenceInterval && config.yAxisKeys.length > 0 && (
            <Area
              type="monotone"
              dataKey={`${config.yAxisKeys[0]}_upper`}
              stroke="none"
              fill={palette[0]}
              fillOpacity={0.12}
              legendType="none"
              isAnimationActive={false}
            />
          )}

          {/* Render Lines for each metric: Historical (Solid) + Forecast (Dashed) */}
          {config.yAxisKeys.map((yKey, index) => {
            const color = palette[index % palette.length];

            return (
              <React.Fragment key={yKey}>
                {/* Solid Line for Historical Observation */}
                <Line
                  type={config.curveType || 'monotone'}
                  dataKey={yKey}
                  name={`${yKey} (Historical)`}
                  stroke={color}
                  strokeWidth={2.5}
                  dot={{ r: 3.5, strokeWidth: 1.5, fill: '#ffffff', stroke: color }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />

                {/* Dashed Line for 30-Day Regression Forecast */}
                <Line
                  type="monotone"
                  dataKey={`${yKey}_forecast`}
                  name={`${yKey} (30d Forecast)`}
                  stroke={color}
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={{ r: 2.5, strokeWidth: 1, fill: color }}
                  activeDot={{ r: 5 }}
                  connectNulls={true}
                  isAnimationActive={false}
                />
              </React.Fragment>
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
