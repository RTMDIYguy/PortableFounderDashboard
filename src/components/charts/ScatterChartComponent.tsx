import React from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
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

export const ScatterChartComponent: React.FC<Props> = ({ data, config }) => {
  const xKey = config.xAxisKey;
  const yKey = config.yAxisKeys[0];
  const zKey = config.zAxisKey;
  const color = config.colorPalette?.[0] || '#4f46e5';

  if (!data || data.length === 0 || !xKey || !yKey) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        Please select numeric metrics for X and Y axes.
      </div>
    );
  }

  const chartData = data.map(item => ({
    [xKey]: Number(item[xKey]) || 0,
    [yKey]: Number(item[yKey]) || 0,
    ...(zKey ? { [zKey]: Number(item[zKey]) || 10 } : {}),
    _raw: item,
  }));

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 16, right: 24, left: 16, bottom: 24 }}>
          {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
          <XAxis
            type="number"
            dataKey={xKey}
            name={xKey}
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickFormatter={val => formatNumber(val)}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          <YAxis
            type="number"
            dataKey={yKey}
            name={yKey}
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickFormatter={val => formatNumber(val)}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          {zKey && <ZAxis type="number" dataKey={zKey} range={[40, 400]} name={zKey} />}
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{
              backgroundColor: '#ffffff',
              borderColor: '#e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              fontSize: '12px',
            }}
            formatter={(value: any, name: any) => [formatNumber(Number(value)), name]}
          />
          {config.showLegend && <Legend wrapperStyle={{ paddingTop: 10, fontSize: '12px' }} />}
          <Scatter name={`${yKey} vs ${xKey}`} data={chartData} fill={color} fillOpacity={0.7} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};
