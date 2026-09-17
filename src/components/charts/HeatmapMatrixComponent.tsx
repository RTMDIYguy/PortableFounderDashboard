import React, { useMemo } from 'react';
import { ChartConfig } from '../../types';
import { computeHeatmapMatrix, formatNumber } from '../../utils/dataProcessing';

interface Props {
  data: Record<string, any>[];
  config: ChartConfig;
}

export const HeatmapMatrixComponent: React.FC<Props> = ({ data, config }) => {
  const rowKey = config.xAxisKey;
  const colKey = config.yAxisKeys[0];
  const valKey = config.zAxisKey || config.yAxisKeys[1] || config.yAxisKeys[0];

  const heatmap = useMemo(() => {
    if (!data || !rowKey || !colKey || !valKey) return null;
    return computeHeatmapMatrix(data, rowKey, colKey, valKey, config.aggregation || 'sum');
  }, [data, rowKey, colKey, valKey, config.aggregation]);

  if (!heatmap || heatmap.rowLabels.length === 0 || heatmap.colLabels.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        Heatmap requires a Row Dimension (X-Axis), Column Dimension (1st Y-Metric/Dimension), and Value Metric.
      </div>
    );
  }

  const { rowLabels, colLabels, matrix, min, max } = heatmap;
  const range = max - min || 1;

  const getColor = (val: number) => {
    if (val === 0) return 'bg-slate-50 text-slate-400';
    const ratio = Math.max(0, Math.min(1, (val - min) / range));
    if (ratio < 0.2) return 'bg-indigo-50 text-indigo-900 border border-indigo-100';
    if (ratio < 0.4) return 'bg-indigo-200 text-indigo-950 font-medium';
    if (ratio < 0.6) return 'bg-indigo-400 text-white font-semibold';
    if (ratio < 0.8) return 'bg-indigo-600 text-white font-bold';
    return 'bg-indigo-900 text-white font-black';
  };

  const getCellVal = (r: string, c: string) => {
    const item = matrix.find(m => m.row === r && m.col === c);
    return item ? item.value : 0;
  };

  return (
    <div className="h-full w-full overflow-auto p-2">
      <div className="min-w-fit">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="p-2.5 text-left font-semibold text-slate-600 bg-slate-50/70 border-b border-slate-200 sticky top-0">
                {rowKey} \ {colKey}
              </th>
              {colLabels.map(col => (
                <th
                  key={col}
                  className="p-2.5 text-center font-semibold text-slate-700 bg-slate-50/70 border-b border-slate-200 sticky top-0 truncate max-w-[120px]"
                  title={col}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowLabels.map(row => (
              <tr key={row} className="border-b border-slate-100 hover:bg-slate-50/40">
                <td className="p-2.5 font-medium text-slate-800 bg-slate-50/30 whitespace-nowrap">
                  {row}
                </td>
                {colLabels.map(col => {
                  const val = getCellVal(row, col);
                  return (
                    <td key={`${row}-${col}`} className="p-1 text-center">
                      <div
                        className={`py-2 px-2.5 rounded-md transition-transform hover:scale-105 cursor-pointer text-center ${getColor(val)}`}
                        title={`${row} × ${col}: ${formatNumber(val)}`}
                      >
                        {formatNumber(val)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Intensity Legend */}
        <div className="mt-4 flex items-center justify-end gap-2 text-xs text-slate-500">
          <span>Min: {formatNumber(min)}</span>
          <div className="flex h-3 w-32 rounded-sm overflow-hidden border border-slate-200">
            <div className="h-full w-1/5 bg-blue-100" />
            <div className="h-full w-1/5 bg-blue-200" />
            <div className="h-full w-1/5 bg-blue-400" />
            <div className="h-full w-1/5 bg-blue-600" />
            <div className="h-full w-1/5 bg-blue-800" />
          </div>
          <span>Max: {formatNumber(max)}</span>
        </div>
      </div>
    </div>
  );
};
