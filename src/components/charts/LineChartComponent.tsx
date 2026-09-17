import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
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

export const LineChartComponent: React.FC<Props> = ({ data, config }) => {
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
        <LineChart
          data={data}
          margin={{ top: 12, right: 24, left: 16, bottom: 24 }}
        >
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
          {config.yAxisKeys.map((yKey, index) => (
            <Line
              key={yKey}
              type={config.curveType || 'monotone'}
              dataKey={yKey}
              name={yKey}
              stroke={palette[index % palette.length]}
              strokeWidth={2.5}
              dot={{ r: 4, strokeWidth: 2, fill: '#ffffff' }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
