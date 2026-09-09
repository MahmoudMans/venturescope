export const ACCURACY_METRICS = [
  "revenue",
  "cogs",
  "operatingExpenses",
  "ebitda",
  "cashFlow",
  "cashBalance",
  "mrr",
] as const;


export type AccuracyMetric =
  typeof ACCURACY_METRICS[
    number
  ];


export type ForecastObservation = {
  period:
    string;

  actual:
    number;

  forecast:
    number;

  error:
    number;

  absoluteError:
    number;

  absolutePercentageError:
    number |
    null;
};


export type ForecastAccuracyStatistics = {
  observations:
    number;

  actualTotal:
    number;

  forecastTotal:
    number;

  signedError:
    number;

  absoluteError:
    number;

  wape:
    number |
    null;

  mape:
    number |
    null;

  rmse:
    number |
    null;

  biasRate:
    number |
    null;

  accuracyScore:
    number |
    null;
};


export type ForecastBiasClassification =
  | "BALANCED"
  | "OVER_FORECASTING"
  | "UNDER_FORECASTING"
  | "INSUFFICIENT_DATA";


export type ForecastTrendClassification =
  | "IMPROVING"
  | "STABLE"
  | "WORSENING"
  | "INSUFFICIENT_DATA";


export type ForecastAccuracyMetricReport = {
  metric:
    AccuracyMetric;

  observations:
    ForecastObservation[];

  overall:
    ForecastAccuracyStatistics;

  rolling3:
    ForecastAccuracyStatistics;

  rolling6:
    ForecastAccuracyStatistics;

  rolling12:
    ForecastAccuracyStatistics;

  bias:
    ForecastBiasClassification;

  trend:
    ForecastTrendClassification;
};


export type ForecastAccuracyFlag = {
  severity:
    "INFO" |
    "WARNING" |
    "CRITICAL";

  metric:
    AccuracyMetric;

  code:
    string;

  message:
    string;
};


export type ForecastAccuracyReport = {
  matchedPeriods:
    number;

  metrics:
    ForecastAccuracyMetricReport[];

  flags:
    ForecastAccuracyFlag[];

  overallAccuracyScore:
    number |
    null;

  overallWape:
    number |
    null;

  latestPeriod:
    string |
    null;
};
