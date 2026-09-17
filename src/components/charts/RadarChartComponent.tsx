import React from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend,
} from 'recharts';
import { ChartConfig } from '../../types';
import { formatNumber } from '../../utils/dataProcessing';

interface Props {
  data: Record<string, any>[];
  config: ChartConfig;
}

const DEFAULT_PALETTE = ['#4f46e5', '#6366f1', '#059669', '#d97706', '#0284c7'];

export const RadarChartComponent: React.FC<Props> = ({ data, config }) => {
  const palette = config.colorPalette?.length > 0 ? config.colorPalette : DEFAULT_PALETTE;

  if (!data || data.length === 0 || !config.xAxisKey || config.yAxisKeys.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        Radar chart requires a categorical dimension and at least one metric.
      </div>
    );
  }

  // Limit data points to reasonable polygon size
  const radarData = data.slice(0, 10);

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis
            dataKey={config.xAxisKey}
            tick={{ fill: '#64748b', fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={30}
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            tickFormatter={val => formatNumber(val)}
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
          {config.showLegend && <Legend wrapperStyle={{ paddingTop: 8, fontSize: '12px' }} />}
          {config.yAxisKeys.map((yKey, index) => {
            const color = palette[index % palette.length];
            return (
              <Radar
                key={yKey}
                name={yKey}
                dataKey={yKey}
                stroke={color}
                fill={color}
                fillOpacity={0.4}
              />
            );
          })}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
