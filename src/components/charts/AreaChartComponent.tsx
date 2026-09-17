import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ChartConfig } from '../../types';
import { formatNumber } from '../../utils/dataProcessing';

interface Props {
  data: Record<string, any>[];
  config: ChartConfig;
}

const DEFAULT_PALETTE = ['#4f46e5', '#6366f1', '#059669', '#d97706', '#0284c7', '#7c3aed', '#db2777'];

export const AreaChartComponent: React.FC<Props> = ({ data, config }) => {
  const isStacked = config.type === 'stacked-area';
  const palette = config.colorPalette?.length > 0 ? config.colorPalette : DEFAULT_PALETTE;

  if (!data || data.length === 0 || !config.xAxisKey || config.yAxisKeys.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        No data available for the selected axes.
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 12, right: 24, left: 16, bottom: 24 }}
        >
          <defs>
            {config.yAxisKeys.map((yKey, index) => {
              const color = palette[index % palette.length];
              return (
                <linearGradient key={`grad-${yKey}`} id={`grad-${config.id}-${yKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              );
            })}
          </defs>
          {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
          <XAxis
            dataKey={config.xAxisKey}
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={{ stroke: '#cbd5e1' }}
            interval={0}
            angle={data.length > 8 ? -25 : 0}
            textAnchor={data.length > 8 ? 'end' : 'middle'}
          />
          <YAxis
            tickFormatter={(val) => formatNumber(val)}
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              borderColor: '#e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              fontSize: '12px',
            }}
            formatter={(value: any) => [formatNumber(Number(value)), '']}
          />
          {config.showLegend && <Legend wrapperStyle={{ paddingTop: 10, fontSize: '12px' }} />}
          {config.yAxisKeys.map((yKey, index) => {
            const color = palette[index % palette.length];
            return (
              <Area
                key={yKey}
                type={config.curveType || 'monotone'}
                dataKey={yKey}
                name={yKey}
                stroke={color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#grad-${config.id}-${yKey})`}
                stackId={isStacked ? 'stack1' : undefined}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
