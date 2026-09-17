import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  Sector,
} from 'recharts';
import { ChartConfig } from '../../types';
import { formatNumber } from '../../utils/dataProcessing';

interface Props {
  data: Record<string, any>[];
  config: ChartConfig;
}

const DEFAULT_PALETTE = ['#4f46e5', '#6366f1', '#818cf8', '#059669', '#d97706', '#0284c7', '#7c3aed', '#db2777'];

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

  return (
    <g>
      <text x={cx} y={cy - 8} dy={8} textAnchor="middle" fill="#1e293b" className="text-sm font-semibold">
        {payload[props.nameKey || 'name']}
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle" fill="#64748b" className="text-xs">
        {formatNumber(value)} ({((percent || 0) * 100).toFixed(1)}%)
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

export const PieChartComponent: React.FC<Props> = ({ data, config }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const isDonut = config.type === 'donut';
  const palette = config.colorPalette?.length > 0 ? config.colorPalette : DEFAULT_PALETTE;
  const metricKey = config.yAxisKeys[0];

  if (!data || data.length === 0 || !config.xAxisKey || !metricKey) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        Select a category and metric to render pie chart.
      </div>
    );
  }

  const chartData = data.map(item => ({
    name: String(item[config.xAxisKey] ?? ''),
    value: Number(item[metricKey]) || 0,
  })).filter(d => d.value > 0);

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 12, right: 12, left: 12, bottom: 12 }}>
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              borderColor: '#e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              fontSize: '12px',
            }}
            formatter={(val: any) => [formatNumber(Number(val)), metricKey]}
          />
          {config.showLegend && (
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            />
          )}
          <Pie
            // @ts-ignore
            activeIndex={activeIndex !== null ? activeIndex : undefined}
            activeShape={renderActiveShape}
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={isDonut ? '52%' : '0%'}
            outerRadius="78%"
            dataKey="value"
            nameKey="name"
            paddingAngle={isDonut ? 3 : 1}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={palette[index % palette.length]} stroke="#ffffff" strokeWidth={1.5} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
