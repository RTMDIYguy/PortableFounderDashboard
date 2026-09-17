import React, { useState } from 'react';
import { HelpCircle, X, ExternalLink } from 'lucide-react';
import { getMetricInterpretation, MetricInterpretation } from '../utils/metricDefinitions';

interface Props {
  metricKey: string;
  label?: string;
  className?: string;
  align?: 'left' | 'right' | 'center';
  onOpenFullGuide?: (metricKey?: string) => void;
}

export const MetricTooltip: React.FC<Props> = ({
  metricKey,
  label,
  className = '',
  align = 'left',
  onOpenFullGuide,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const info = getMetricInterpretation(metricKey);

  if (!info) {
    // Fallback simple tooltip if not in dictionary
    return (
      <span className={`inline-flex items-center text-slate-400 hover:text-slate-600 transition-colors ${className}`}>
        <HelpCircle className="h-3 w-3 inline ml-1 opacity-70" />
      </span>
    );
  }

  const alignmentClass = 
    align === 'right' ? 'right-0' :
    align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0';

  return (
    <div className="relative inline-block" onMouseLeave={() => setIsOpen(false)}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onMouseEnter={() => setIsOpen(true)}
        className={`inline-flex items-center text-slate-400 hover:text-indigo-600 focus:outline-hidden transition-colors cursor-pointer ${className}`}
        title={`How to interpret ${label || info.name}`}
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full mt-1.5 z-50 w-72 sm:w-80 rounded-lg border border-slate-200 bg-white p-3.5 shadow-xl text-left animate-in fade-in duration-150 ${alignmentClass}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                {info.category}
              </span>
              <h4 className="text-xs font-bold text-slate-900 mt-1">
                {info.name}
              </h4>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-2 space-y-2 text-[11px] leading-relaxed text-slate-600">
            <p className="font-medium text-slate-700">
              {info.description}
            </p>

            <div className="rounded bg-slate-50 p-2 border border-slate-100 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-700">
                <span>HOW TO READ:</span>
                <span className="text-emerald-700 font-semibold">{info.idealRange}</span>
              </div>
              <p className="text-[11px] text-slate-600">
                {info.interpretation}
              </p>
            </div>

            {info.warningSigns && (
              <div className="text-[10px] text-rose-700 bg-rose-50/60 p-1.5 rounded border border-rose-100">
                <span className="font-bold">Watch for: </span>
                {info.warningSigns}
              </div>
            )}
          </div>

          {onOpenFullGuide && (
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenFullGuide(info.key);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
              >
                <span>Read Full Operations Guide</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
