import React, { useMemo } from 'react';
import { ColumnSchema } from '../../types';
import { computeCorrelationMatrix } from '../../utils/dataProcessing';

interface Props {
  data: Record<string, any>[];
  schema: ColumnSchema[];
}

export const CorrelationMatrixComponent: React.FC<Props> = ({ data, schema }) => {
  const result = useMemo(() => {
    return computeCorrelationMatrix(data, schema);
  }, [data, schema]);

  if (!result || result.keys.length < 2) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        Correlation analysis requires at least 2 numerical columns in the dataset.
      </div>
    );
  }

  const { keys, labels, correlations } = result;

  const getCorr = (x: string, y: string) => {
    const item = correlations.find(c => (c.x === x && c.y === y) || (c.x === y && c.y === x));
    return item ? item.correlation : 0;
  };

  const getCorrColor = (corr: number) => {
    if (corr === 1) return 'bg-slate-100 text-slate-700 font-semibold';
    if (corr > 0.7) return 'bg-emerald-600 text-white font-bold';
    if (corr > 0.4) return 'bg-emerald-400 text-slate-900';
    if (corr > 0.1) return 'bg-emerald-100 text-emerald-900';
    if (corr > -0.1) return 'bg-slate-50 text-slate-500';
    if (corr > -0.4) return 'bg-rose-100 text-rose-900';
    if (corr > -0.7) return 'bg-rose-400 text-slate-900';
    return 'bg-rose-600 text-white font-bold';
  };

  return (
    <div className="h-full w-full overflow-auto p-2">
      <div className="min-w-fit">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="p-2.5 text-left font-semibold text-slate-600 bg-slate-50/70 border-b border-slate-200 sticky top-0">
                Metric Pearson Corr
              </th>
              {labels.map(lbl => (
                <th
                  key={lbl}
                  className="p-2.5 text-center font-semibold text-slate-700 bg-slate-50/70 border-b border-slate-200 sticky top-0 truncate max-w-[120px]"
                  title={lbl}
                >
                  {lbl}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keys.map((rowKey, rowIdx) => (
              <tr key={rowKey} className="border-b border-slate-100">
                <td className="p-2.5 font-medium text-slate-800 bg-slate-50/30 whitespace-nowrap">
                  {labels[rowIdx]}
                </td>
                {keys.map(colKey => {
                  const corr = getCorr(rowKey, colKey);
                  return (
                    <td key={`${rowKey}-${colKey}`} className="p-1 text-center">
                      <div
                        className={`py-2 px-3 rounded-md text-center transition-transform hover:scale-105 cursor-pointer ${getCorrColor(corr)}`}
                        title={`Correlation between ${rowKey} and ${colKey}: ${corr}`}
                      >
                        {corr.toFixed(2)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500 px-2">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-rose-500"></span>
            Strong Negative (-1.0)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-slate-200"></span>
            Neutral (0.0)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-emerald-500"></span>
            Strong Positive (+1.0)
          </span>
        </div>
      </div>
    </div>
  );
};
