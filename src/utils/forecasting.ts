import { formatNumber } from './dataProcessing';

export interface LinearRegressionMetrics {
  slope: number; // daily slope (rate of change per day)
  intercept: number;
  rSquared: number;
  startValue: number;
  endValue: number; // Projected value at day 30
  projectedChange: number;
  projectedPercentChange: number;
  trend: 'upward' | 'downward' | 'stable';
  equation: string;
  modelQuality: 'Strong Fit' | 'Moderate Fit' | 'Weak Fit';
  standardError: number;
}

export interface ForecastPoint extends Record<string, any> {
  [key: string]: any;
  isForecast: boolean;
  forecastDayIndex?: number;
  isBoundaryPoint?: boolean;
}

export interface ForecastResult {
  combinedData: ForecastPoint[];
  historicalCount: number;
  forecastCount: number;
  horizonDays: number;
  boundaryLabel: string;
  metrics: Record<string, LinearRegressionMetrics>;
  primaryMetricKey: string;
}

/**
 * Checks if a string or value can be treated as a valid calendar date
 */
function tryParseDate(val: any): Date | null {
  if (val === null || val === undefined) return null;
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  const str = String(val).trim();
  // Don't treat purely short numbers like "2024" or "10" as dates unless it looks like YYYY-MM or has separators
  if (/^\d{4}$/.test(str) || /^\d{1,3}$/.test(str)) return null;
  const parsed = Date.parse(str);
  if (!isNaN(parsed) && str.length >= 4) {
    const d = new Date(parsed);
    if (d.getFullYear() > 1970 && d.getFullYear() < 2100) {
      return d;
    }
  }
  return null;
}

/**
 * Format date nicely for chart labels
 */
function formatDateLabel(d: Date, formatStyle: 'short' | 'month-day' | 'iso' = 'month-day'): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();

  if (formatStyle === 'iso') {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  }

  return `${month} ${day}`;
}

/**
 * Calculates Ordinary Least Squares (OLS) simple linear regression: y = m * x + b
 */
export function calculateLinearRegression(
  xVals: number[],
  yVals: number[]
): {
  slope: number;
  intercept: number;
  rSquared: number;
  standardError: number;
} {
  const n = xVals.length;
  if (n < 2) {
    return {
      slope: 0,
      intercept: yVals[0] || 0,
      rSquared: 1,
      standardError: 0,
    };
  }

  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < n; i++) {
    sumX += xVals[i];
    sumY += yVals[i];
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  let ssXX = 0;
  let ssYY = 0;
  let ssXY = 0;

  for (let i = 0; i < n; i++) {
    const dx = xVals[i] - meanX;
    const dy = yVals[i] - meanY;
    ssXX += dx * dx;
    ssYY += dy * dy;
    ssXY += dx * dy;
  }

  // If no variance in X, slope is 0
  const slope = ssXX === 0 ? 0 : ssXY / ssXX;
  const intercept = meanY - slope * meanX;

  // Calculate residuals and R-squared
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const yPred = slope * xVals[i] + intercept;
    const res = yVals[i] - yPred;
    ssRes += res * res;
  }

  let rSquared = 1;
  if (ssYY > 0) {
    rSquared = Math.max(0, Math.min(1, 1 - (ssRes / ssYY)));
  }

  const standardError = n > 2 ? Math.sqrt(ssRes / (n - 2)) : 0;

  return {
    slope,
    intercept,
    rSquared,
    standardError,
  };
}

/**
 * Main forecasting engine: computes linear regression on historical points and
 * projects potential metric values for the next N days (default 30 days).
 */
export function generateForecast(
  data: Record<string, any>[],
  xAxisKey: string,
  yAxisKeys: string[],
  horizonDays: number = 30
): ForecastResult {
  if (!data || data.length === 0 || !xAxisKey || yAxisKeys.length === 0) {
    return {
      combinedData: [],
      historicalCount: 0,
      forecastCount: 0,
      horizonDays,
      boundaryLabel: '',
      metrics: {},
      primaryMetricKey: yAxisKeys[0] || '',
    };
  }

  const n = data.length;
  const primaryY = yAxisKeys[0];

  // 1. Determine timeline/dates from historical data
  const dateCandidates = data.map(r => tryParseDate(r[xAxisKey]));
  const hasRecognizedDates = dateCandidates.filter(d => d !== null).length >= Math.ceil(n * 0.7);

  let lastKnownDate: Date = new Date();
  let avgDaysPerHistoricalStep = 1;

  if (hasRecognizedDates) {
    const validDates = dateCandidates.filter((d): d is Date => d !== null);
    if (validDates.length > 0) {
      lastKnownDate = new Date(validDates[validDates.length - 1]);
      if (validDates.length >= 2) {
        const totalSpanDays = Math.max(
          1,
          Math.abs(validDates[validDates.length - 1].getTime() - validDates[0].getTime()) / (1000 * 60 * 60 * 24)
        );
        avgDaysPerHistoricalStep = Math.max(0.1, totalSpanDays / (validDates.length - 1));
      }
    }
  } else {
    // If Month strings like "Jan", "Feb", "March", or sequential categories
    const isMonthName = data.some(r => /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(String(r[xAxisKey])));
    if (isMonthName) {
      avgDaysPerHistoricalStep = 30; // 1 step = 30 days
    } else {
      // Default: Assume historical sequence spans ~30-90 days or daily steps
      avgDaysPerHistoricalStep = 1;
    }
  }

  // 2. Perform linear regression for each Y metric
  const regressionMap: Record<string, LinearRegressionMetrics> = {};
  const rawRegressionStats: Record<string, { slope: number; intercept: number; rSquared: number; standardError: number }> = {};

  yAxisKeys.forEach(yKey => {
    // Collect (t, y) pairs where t is normalized time in days from point 0
    const xVals: number[] = [];
    const yVals: number[] = [];

    for (let i = 0; i < n; i++) {
      const val = Number(data[i][yKey]);
      if (!isNaN(val)) {
        // Time in days from the start of the series
        const tDays = i * avgDaysPerHistoricalStep;
        xVals.push(tDays);
        yVals.push(val);
      }
    }

    const reg = calculateLinearRegression(xVals, yVals);
    rawRegressionStats[yKey] = reg;

    // Daily slope is reg.slope (since xVals are already in days)
    const dailySlope = reg.slope;
    const lastT = (n - 1) * avgDaysPerHistoricalStep;
    const startVal = Number(data[n - 1][yKey]) || (reg.slope * lastT + reg.intercept);
    const projectedEndVal = startVal + dailySlope * horizonDays;
    const projChange = projectedEndVal - startVal;
    const projPercent = startVal !== 0 ? (projChange / Math.abs(startVal)) * 100 : 0;

    let trend: 'upward' | 'downward' | 'stable' = 'stable';
    if (Math.abs(projPercent) >= 0.5) {
      trend = projChange > 0 ? 'upward' : 'downward';
    }

    let modelQuality: 'Strong Fit' | 'Moderate Fit' | 'Weak Fit' = 'Moderate Fit';
    if (reg.rSquared >= 0.75) modelQuality = 'Strong Fit';
    else if (reg.rSquared < 0.4) modelQuality = 'Weak Fit';

    // Format equation: y = mx + b
    const slopeStr = Math.abs(dailySlope) >= 0.01 
      ? dailySlope.toFixed(2) 
      : dailySlope.toExponential(2);
    const sign = reg.intercept >= 0 ? '+' : '-';
    const interceptStr = Math.abs(reg.intercept).toFixed(1);
    const equation = `y = ${slopeStr}x ${sign} ${interceptStr}`;

    regressionMap[yKey] = {
      slope: dailySlope,
      intercept: reg.intercept,
      rSquared: reg.rSquared,
      startValue: startVal,
      endValue: projectedEndVal,
      projectedChange: projChange,
      projectedPercentChange: projPercent,
      trend,
      equation,
      modelQuality,
      standardError: reg.standardError,
    };
  });

  // 3. Build combined dataset (historical + bridge + projected points)
  const combinedData: ForecastPoint[] = [];

  // Add historical points
  for (let i = 0; i < n; i++) {
    const row = { ...data[i] };
    const point: ForecastPoint = {
      ...row,
      isForecast: false,
      isBoundaryPoint: i === n - 1,
    };

    // For the boundary point (last historical point), also assign forecast key
    // so Recharts connects the historical solid line directly into the dashed forecast line
    if (i === n - 1) {
      yAxisKeys.forEach(yKey => {
        const val = Number(row[yKey]) || 0;
        point[`${yKey}_forecast`] = val;
        point[`${yKey}_lower`] = val;
        point[`${yKey}_upper`] = val;
      });
    }

    combinedData.push(point);
  }

  const boundaryLabel = String(data[n - 1][xAxisKey]);

  // Generate 30 future projection points (Day 1 to Day 30)
  // To avoid chart clutter if n is small, 30 days provides day-by-day granularity
  for (let d = 1; d <= horizonDays; d++) {
    let futureLabel: string;
    if (hasRecognizedDates) {
      const futureDate = new Date(lastKnownDate.getTime() + d * 24 * 60 * 60 * 1000);
      futureLabel = formatDateLabel(futureDate, 'month-day');
    } else {
      futureLabel = `Day +${d}`;
    }

    const forecastPoint: ForecastPoint = {
      [xAxisKey]: futureLabel,
      isForecast: true,
      forecastDayIndex: d,
    };

    // Calculate projected values and 95% confidence interval for each metric
    yAxisKeys.forEach(yKey => {
      const reg = rawRegressionStats[yKey];
      const stats = regressionMap[yKey];
      if (!reg || !stats) return;

      // Projected value
      const projectedVal = stats.startValue + stats.slope * d;

      // Confidence corridor margin: expands as we move further into the future
      // Margin = 1.96 * Se * sqrt(1 + 1/n + (d^2 / (n * 10)))
      const uncertaintyExpansion = Math.sqrt(1 + (1 / Math.max(1, n)) + ((d * d) / (Math.max(1, n) * 15)));
      const margin = 1.96 * (reg.standardError || Math.abs(projectedVal * 0.05)) * uncertaintyExpansion;

      const lowerBound = Math.max(0, projectedVal - margin);
      const upperBound = projectedVal + margin;

      forecastPoint[`${yKey}_forecast`] = Math.round(projectedVal * 100) / 100;
      forecastPoint[`${yKey}_lower`] = Math.round(lowerBound * 100) / 100;
      forecastPoint[`${yKey}_upper`] = Math.round(upperBound * 100) / 100;
      forecastPoint[`${yKey}_margin`] = Math.round(margin * 100) / 100;
      // Also provide the main key as undefined/null so historical solid line stops at boundary
      forecastPoint[yKey] = null;
    });

    combinedData.push(forecastPoint);
  }

  return {
    combinedData,
    historicalCount: n,
    forecastCount: horizonDays,
    horizonDays,
    boundaryLabel,
    metrics: regressionMap,
    primaryMetricKey: primaryY,
  };
}
