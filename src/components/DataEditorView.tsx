import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Download, 
  Search, 
  ArrowUpDown,
  Check
} from 'lucide-react';
import Papa from 'papaparse';
import { Dataset, ColumnSchema } from '../types';
import { inferSchema, normalizeData } from '../utils/dataProcessing';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  dataset: Dataset;
  onUpdateDataset: (updated: Dataset) => void;
}

export const DataEditorView: React.FC<Props> = ({
  isOpen,
  onClose,
  dataset,
  onUpdateDataset,
}) => {
  const [rows, setRows] = useState<Record<string, any>[]>(dataset.data);
  const [schema, setSchema] = useState<ColumnSchema[]>(dataset.schema);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; colKey: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  if (!isOpen) return null;

  const handleSort = (colKey: string) => {
    if (sortCol === colKey) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(colKey);
      setSortAsc(true);
    }
  };

  const filteredRows = rows.filter(r => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return Object.values(r).some(v => v !== null && v !== undefined && String(v).toLowerCase().includes(q));
  });

  const sortedRows = [...filteredRows].sort((a, b) => {
    if (!sortCol) return 0;
    const valA = a[sortCol];
    const valB = b[sortCol];
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc ? valA - valB : valB - valA;
    }
    return sortAsc 
      ? String(valA ?? '').localeCompare(String(valB ?? ''))
      : String(valB ?? '').localeCompare(String(valA ?? ''));
  });

  const totalPages = Math.ceil(sortedRows.length / pageSize) || 1;
  const paginatedRows = sortedRows.slice((page - 1) * pageSize, page * pageSize);

  const handleStartEdit = (rowIdx: number, colKey: string, currentVal: any) => {
    setEditingCell({ rowIdx, colKey });
    setEditValue(currentVal !== undefined && currentVal !== null ? String(currentVal) : '');
  };

  const handleSaveCell = () => {
    if (!editingCell) return;
    const { rowIdx, colKey } = editingCell;
    
    // Target the specific row in sorted list, find its reference in main rows array
    const targetRow = paginatedRows[rowIdx];
    const originalIndex = rows.indexOf(targetRow);

    if (originalIndex !== -1) {
      const updatedRows = [...rows];
      const colDef = schema.find(s => s.key === colKey);
      let parsedVal: any = editValue;
      if (colDef?.type === 'number') {
        const num = Number(editValue.replace(/,/g, ''));
        parsedVal = isNaN(num) ? 0 : num;
      }
      updatedRows[originalIndex] = {
        ...updatedRows[originalIndex],
        [colKey]: parsedVal,
      };
      setRows(updatedRows);
    }
    setEditingCell(null);
  };

  const handleAddRow = () => {
    const newRow: Record<string, any> = {};
    schema.forEach(col => {
      newRow[col.key] = col.type === 'number' ? 0 : '';
    });
    setRows([newRow, ...rows]);
  };

  const handleDeleteRow = (targetRow: Record<string, any>) => {
    setRows(rows.filter(r => r !== targetRow));
  };

  const handleSaveChangesToDashboard = () => {
    const newSchema = inferSchema(rows);
    const normalized = normalizeData(rows, newSchema);
    onUpdateDataset({
      ...dataset,
      data: normalized,
      schema: newSchema,
    });
    onClose();
  };

  const handleDownloadCsv = () => {
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${dataset.name.toLowerCase().replace(/\s+/g, '_')}_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="flex flex-col w-full max-w-6xl h-[88vh] rounded-lg bg-white shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-xs">
              Δ
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight">
                Live Data Grid & Table Inspector
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Inspecting <strong className="text-slate-800 font-bold">{dataset.name}</strong> • Double-click any cell to edit inline.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search across cells..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                className="w-full rounded border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-hidden font-medium"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Showing <strong className="text-slate-800">{sortedRows.length}</strong> of {rows.length} rows
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddRow}
              className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-indigo-600" />
              Add Row
            </button>
            <button
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="flex-1 overflow-auto bg-white">
          <table className="w-full border-collapse text-xs text-left">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-black text-slate-400">
              <tr>
                <th className="w-12 px-4 py-2.5 text-center">#</th>
                {schema.map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-4 py-2.5 cursor-pointer hover:bg-slate-100/70 select-none transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate">{col.label}</span>
                      <ArrowUpDown className="h-3 w-3 text-slate-400 shrink-0" />
                    </div>
                  </th>
                ))}
                <th className="w-16 px-4 py-2.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedRows.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2 text-center text-slate-400 font-mono text-[11px]">
                    {(page - 1) * pageSize + rowIdx + 1}
                  </td>
                  {schema.map(col => {
                    const isEditing = editingCell?.rowIdx === rowIdx && editingCell?.colKey === col.key;
                    const cellVal = row[col.key];

                    return (
                      <td
                        key={col.key}
                        onDoubleClick={() => handleStartEdit(rowIdx, col.key, cellVal)}
                        className="px-4 py-2 text-slate-800 max-w-[220px] truncate font-medium"
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              autoFocus
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveCell();
                                if (e.key === 'Escape') setEditingCell(null);
                              }}
                              className="w-full rounded border border-indigo-600 px-1.5 py-0.5 text-xs text-slate-900 focus:outline-hidden"
                            />
                            <button
                              onClick={handleSaveCell}
                              className="rounded bg-indigo-600 p-1 text-white hover:bg-indigo-700 cursor-pointer"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <span
                            onClick={() => handleStartEdit(rowIdx, col.key, cellVal)}
                            className="cursor-pointer hover:text-indigo-600 hover:underline decoration-slate-300"
                            title="Click to edit"
                          >
                            {cellVal !== undefined && cellVal !== null ? String(cellVal) : '-'}
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => handleDeleteRow(row)}
                      className="rounded p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete row"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination & Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3 bg-slate-50">
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
            >
              Previous
            </button>
            <span className="text-xs text-slate-600 font-semibold">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
            >
              Next
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded border border-slate-300 bg-white px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveChangesToDashboard}
              className="flex items-center gap-1.5 rounded bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-xs cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              Apply Changes to Charts
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
