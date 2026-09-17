import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
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

export const ComposedChartComponent: React.FC<Props> = ({ data, config }) => {
  const primaryBarKey = config.yAxisKeys[0];
  const secondaryKey = config.secondaryYAxisKey || config.yAxisKeys[1];
  const thirdKey = config.yAxisKeys[2];

  if (!data || data.length === 0 || !config.xAxisKey || !primaryBarKey) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        Composed chart requires a dimension and at least one metric.
      </div>
    );
  }

  const barColor = config.colorPalette?.[0] || '#4f46e5';
  const lineColor = config.colorPalette?.[1] || '#059669';
  const areaColor = config.colorPalette?.[2] || '#d97706';

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 12, right: 24, left: 16, bottom: 24 }}>
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
            yAxisId="left"
            tickFormatter={val => formatNumber(val)}
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          {secondaryKey && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={val => formatNumber(val)}
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: '#cbd5e1' }}
            />
          )}
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
          
          <Bar
            yAxisId="left"
            dataKey={primaryBarKey}
            name={primaryBarKey}
            fill={barColor}
            radius={[4, 4, 0, 0]}
          />
          
          {secondaryKey && (
            <Line
              yAxisId="right"
              type={config.curveType || 'monotone'}
              dataKey={secondaryKey}
              name={secondaryKey}
              stroke={lineColor}
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
            />
          )}

          {thirdKey && (
            <Area
              yAxisId="left"
              type="monotone"
              dataKey={thirdKey}
              name={thirdKey}
              fill={areaColor}
              stroke={areaColor}
              fillOpacity={0.25}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
