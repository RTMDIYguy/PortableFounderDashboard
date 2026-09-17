import { ColumnSchema, ColumnType, AggregationType, FilterState } from '../types';

export function inferSchema(data: Record<string, any>[]): ColumnSchema[] {
  if (!data || data.length === 0) return [];
  
  const sample = data.slice(0, 100);
  const keys = Array.from(new Set(sample.flatMap(row => Object.keys(row))));

  return keys.map(key => {
    let numericCount = 0;
    let dateCount = 0;
    let booleanCount = 0;
    let validCount = 0;
    const values = sample.map(r => r[key]).filter(v => v !== null && v !== undefined && v !== '');

    let min = Infinity;
    let max = -Infinity;
    const uniqueSet = new Set<string>();

    values.forEach(val => {
      validCount++;
      const strVal = String(val).trim();
      uniqueSet.add(strVal);

      // check boolean
      if (typeof val === 'boolean' || strVal.toLowerCase() === 'true' || strVal.toLowerCase() === 'false') {
        booleanCount++;
      }

      // check number
      const cleanNumStr = strVal.replace(/^[$,€£¥]/, '').replace(/%$/, '').replace(/,/g, '');
      const parsedNum = Number(cleanNumStr);
      if (!isNaN(parsedNum) && cleanNumStr !== '') {
        numericCount++;
        if (parsedNum < min) min = parsedNum;
        if (parsedNum > max) max = parsedNum;
      }

      // check date
      if (isNaN(parsedNum) && !isNaN(Date.parse(strVal)) && strVal.length > 4 && /[/-]/.test(strVal)) {
        dateCount++;
      }
    });

    let type: ColumnType = 'string';
    if (validCount > 0) {
      if (numericCount / validCount >= 0.75) {
        type = 'number';
      } else if (dateCount / validCount >= 0.75) {
        type = 'date';
      } else if (booleanCount / validCount >= 0.75) {
        type = 'boolean';
      }
    }

    const uniqueValues = Array.from(uniqueSet);

    return {
      key,
      label: formatLabel(key),
      type,
      min: min !== Infinity ? min : undefined,
      max: max !== -Infinity ? max : undefined,
      uniqueValues: uniqueValues.length <= 100 ? uniqueValues : uniqueValues.slice(0, 100),
    };
  });
}

export function formatLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function normalizeData(data: Record<string, any>[], schema: ColumnSchema[]): Record<string, any>[] {
  const numberKeys = new Set(schema.filter(s => s.type === 'number').map(s => s.key));

  return data.map(row => {
    const newRow: Record<string, any> = { ...row };
    for (const key of numberKeys) {
      const val = row[key];
      if (val !== null && val !== undefined && val !== '') {
        if (typeof val === 'number') {
          newRow[key] = val;
        } else {
          const cleanStr = String(val).replace(/^[$,€£¥]/, '').replace(/%$/, '').replace(/,/g, '').trim();
          const parsed = Number(cleanStr);
          newRow[key] = isNaN(parsed) ? 0 : parsed;
        }
      } else {
        newRow[key] = 0;
      }
    }
    return newRow;
  });
}

export function filterDataset(
  data: Record<string, any>[],
  schema: ColumnSchema[],
  filters: FilterState
): Record<string, any>[] {
  return data.filter(row => {
    // Search query check
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      const matchesSearch = Object.values(row).some(v => 
        v !== null && v !== undefined && String(v).toLowerCase().includes(q)
      );
      if (!matchesSearch) return false;
    }

    // Category filters check
    for (const [catKey, selectedVals] of Object.entries(filters.categoryFilters)) {
      if (selectedVals && selectedVals.length > 0) {
        const rowVal = String(row[catKey] ?? '');
        if (!selectedVals.includes(rowVal)) {
          return false;
        }
      }
    }

    // Numeric ranges check
    for (const [numKey, [min, max]] of Object.entries(filters.numericRanges)) {
      const val = Number(row[numKey]);
      if (!isNaN(val)) {
        if (val < min || val > max) {
          return false;
        }
      }
    }

    return true;
  });
}

export function aggregateData(
  data: Record<string, any>[],
  xAxisKey: string,
  yAxisKeys: string[],
  aggregation: AggregationType,
  sortBy?: 'none' | 'x-asc' | 'x-desc' | 'y-asc' | 'y-desc',
  limit?: number
): Record<string, any>[] {
  if (!data || data.length === 0) return [];
  if (!xAxisKey) return [];

  // Group by X axis
  const groups = new Map<string, Record<string, any>[]>();

  data.forEach(row => {
    const rawX = row[xAxisKey];
    const groupKey = rawX !== undefined && rawX !== null && rawX !== '' ? String(rawX) : '(Empty)';
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(row);
  });

  const result: Record<string, any>[] = [];

  groups.forEach((rows, groupKey) => {
    const record: Record<string, any> = {
      [xAxisKey]: groupKey,
      _count: rows.length,
    };

    yAxisKeys.forEach(yKey => {
      const values = rows
        .map(r => Number(r[yKey]))
        .filter(v => !isNaN(v));

      if (values.length === 0) {
        record[yKey] = 0;
        return;
      }

      switch (aggregation) {
        case 'sum':
          record[yKey] = values.reduce((a, b) => a + b, 0);
          break;
        case 'avg':
          record[yKey] = Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2));
          break;
        case 'min':
          record[yKey] = Math.min(...values);
          break;
        case 'max':
          record[yKey] = Math.max(...values);
          break;
        case 'count':
          record[yKey] = values.length;
          break;
        case 'none':
        default:
          record[yKey] = values[0] || 0;
          break;
      }
    });

    result.push(record);
  });

  // Sorting
  if (sortBy && sortBy !== 'none') {
    const primaryY = yAxisKeys[0];
    if (sortBy === 'x-asc') {
      result.sort((a, b) => String(a[xAxisKey]).localeCompare(String(b[xAxisKey]), undefined, { numeric: true }));
    } else if (sortBy === 'x-desc') {
      result.sort((a, b) => String(b[xAxisKey]).localeCompare(String(a[xAxisKey]), undefined, { numeric: true }));
    } else if (sortBy === 'y-asc' && primaryY) {
      result.sort((a, b) => (a[primaryY] ?? 0) - (b[primaryY] ?? 0));
    } else if (sortBy === 'y-desc' && primaryY) {
      result.sort((a, b) => (b[primaryY] ?? 0) - (a[primaryY] ?? 0));
    }
  }

  if (limit && limit > 0) {
    return result.slice(0, limit);
  }

  return result;
}

export interface KpiMetric {
  key: string;
  label: string;
  sum: number;
  avg: number;
  min: number;
  max: number;
  count: number;
  latestDelta?: number;
}

export function computeKpis(data: Record<string, any>[], schema: ColumnSchema[]): KpiMetric[] {
  const numericColumns = schema.filter(col => col.type === 'number');
  if (!data || data.length === 0 || numericColumns.length === 0) return [];

  return numericColumns.map(col => {
    const values = data
      .map(r => Number(r[col.key]))
      .filter(v => !isNaN(v));

    if (values.length === 0) {
      return {
        key: col.key,
        label: col.label,
        sum: 0,
        avg: 0,
        min: 0,
        max: 0,
        count: 0,
      };
    }

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = Number((sum / values.length).toFixed(2));
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Delta estimate comparing last 20% to first 20%
    let latestDelta: number | undefined;
    if (values.length >= 4) {
      const sliceSize = Math.max(1, Math.floor(values.length * 0.25));
      const firstAvg = values.slice(0, sliceSize).reduce((a, b) => a + b, 0) / sliceSize;
      const lastAvg = values.slice(-sliceSize).reduce((a, b) => a + b, 0) / sliceSize;
      if (firstAvg !== 0) {
        latestDelta = Number((((lastAvg - firstAvg) / Math.abs(firstAvg)) * 100).toFixed(1));
      }
    }

    return {
      key: col.key,
      label: col.label,
      sum,
      avg,
      min,
      max,
      count: values.length,
      latestDelta,
    };
  });
}

export function computeHeatmapMatrix(
  data: Record<string, any>[],
  rowKey: string,
  colKey: string,
  valKey: string,
  aggregation: AggregationType = 'sum'
): { rowLabels: string[]; colLabels: string[]; matrix: { row: string; col: string; value: number }[]; min: number; max: number } {
  if (!data || data.length === 0 || !rowKey || !colKey || !valKey) {
    return { rowLabels: [], colLabels: [], matrix: [], min: 0, max: 0 };
  }

  const rowSet = new Set<string>();
  const colSet = new Set<string>();
  const cellBuckets = new Map<string, number[]>();

  data.forEach(item => {
    const r = String(item[rowKey] ?? '(Empty)');
    const c = String(item[colKey] ?? '(Empty)');
    const v = Number(item[valKey]);

    rowSet.add(r);
    colSet.add(c);

    const bucketKey = `${r}:::${c}`;
    if (!cellBuckets.has(bucketKey)) {
      cellBuckets.set(bucketKey, []);
    }
    if (!isNaN(v)) {
      cellBuckets.get(bucketKey)!.push(v);
    }
  });

  const rowLabels = Array.from(rowSet).slice(0, 15);
  const colLabels = Array.from(colSet).slice(0, 15);

  let minVal = Infinity;
  let maxVal = -Infinity;

  const matrix: { row: string; col: string; value: number }[] = [];

  rowLabels.forEach(row => {
    colLabels.forEach(col => {
      const vals = cellBuckets.get(`${row}:::${col}`) || [];
      let calculatedVal = 0;
      if (vals.length > 0) {
        if (aggregation === 'sum') {
          calculatedVal = vals.reduce((a, b) => a + b, 0);
        } else if (aggregation === 'avg') {
          calculatedVal = Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1));
        } else if (aggregation === 'count') {
          calculatedVal = vals.length;
        } else if (aggregation === 'max') {
          calculatedVal = Math.max(...vals);
        } else if (aggregation === 'min') {
          calculatedVal = Math.min(...vals);
        }
      }
      if (calculatedVal < minVal) minVal = calculatedVal;
      if (calculatedVal > maxVal) maxVal = calculatedVal;
      matrix.push({ row, col, value: calculatedVal });
    });
  });

  return {
    rowLabels,
    colLabels,
    matrix,
    min: minVal === Infinity ? 0 : minVal,
    max: maxVal === -Infinity ? 0 : maxVal,
  };
}

export function computeCorrelationMatrix(data: Record<string, any>[], schema: ColumnSchema[]): {
  keys: string[];
  labels: string[];
  correlations: { x: string; y: string; correlation: number }[];
} {
  const numericKeys = schema.filter(s => s.type === 'number').map(s => s.key).slice(0, 6);
  if (numericKeys.length < 2 || data.length < 2) {
    return { keys: [], labels: [], correlations: [] };
  }

  const vectors: Record<string, number[]> = {};
  numericKeys.forEach(k => {
    vectors[k] = data.map(d => Number(d[k]) || 0);
  });

  function getPearson(x: number[], y: number[]) {
    const n = x.length;
    if (n === 0) return 0;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const meanX = sumX / n;
    const meanY = sumY / n;

    let numerator = 0;
    let denomX = 0;
    let denomY = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      numerator += dx * dy;
      denomX += dx * dx;
      denomY += dy * dy;
    }

    const denominator = Math.sqrt(denomX * denomY);
    if (denominator === 0) return 0;
    return Number((numerator / denominator).toFixed(2));
  }

  const correlations: { x: string; y: string; correlation: number }[] = [];
  numericKeys.forEach(xKey => {
    numericKeys.forEach(yKey => {
      const corr = xKey === yKey ? 1 : getPearson(vectors[xKey], vectors[yKey]);
      correlations.push({ x: xKey, y: yKey, correlation: corr });
    });
  });

  return {
    keys: numericKeys,
    labels: numericKeys.map(k => schema.find(s => s.key === k)?.label || k),
    correlations,
  };
}

export function formatNumber(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return '0';
  if (Math.abs(val) >= 1_000_000) {
    return (val / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (Math.abs(val) >= 1_000) {
    return (val / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return Number(val.toFixed(2)).toLocaleString();
}
