export type ColumnType = 'string' | 'number' | 'date' | 'boolean';

export interface ColumnSchema {
  key: string;
  label: string;
  type: ColumnType;
  min?: number;
  max?: number;
  uniqueValues?: string[];
}

export type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none';

export type ChartType = 
  | 'bar'
  | 'horizontal-bar'
  | 'stacked-bar'
  | 'line'
  | 'area'
  | 'stacked-area'
  | 'pie'
  | 'donut'
  | 'scatter'
  | 'radar'
  | 'composed'
  | 'heatmap'
  | 'correlation';

export interface ChartConfig {
  id: string;
  title: string;
  type: ChartType;
  xAxisKey: string;
  yAxisKeys: string[];
  secondaryYAxisKey?: string; // For composed chart
  zAxisKey?: string; // For scatter bubble size or heatmap value
  aggregation: AggregationType;
  sortBy?: 'none' | 'x-asc' | 'x-desc' | 'y-asc' | 'y-desc';
  limit?: number;
  colorPalette: string[];
  showGrid: boolean;
  showLegend: boolean;
  showValues: boolean;
  curveType: 'monotone' | 'linear' | 'step';
  forecastingEnabled?: boolean;
  forecastDays?: number;
}

export interface FilterState {
  searchQuery: string;
  categoryFilters: Record<string, string[]>;
  numericRanges: Record<string, [number, number]>;
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  data: Record<string, any>[];
  schema: ColumnSchema[];
}

export type ThresholdCondition = 'greater_than' | 'less_than';

export interface MetricAlertThreshold {
  id: string;
  metricKey: string;
  metricLabel: string;
  condition: ThresholdCondition;
  thresholdValue: number;
  enabled: boolean;
  severity?: 'warning' | 'critical';
  customMessage?: string;
}
