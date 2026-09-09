export const ACTUAL_METRICS = [
  "revenue",
  "cogs",
  "operatingExpenses",
  "ebitda",
  "netIncome",
  "cashFlow",
  "cashBalance",
  "mrr",
  "customers",
] as const;


export type ActualMetric =
  typeof ACTUAL_METRICS[
    number
  ];


export type ActualFinancialPeriod = {
  period:
    string;

  revenue:
    number |
    null;

  cogs:
    number |
    null;

  operatingExpenses:
    number |
    null;

  ebitda:
    number |
    null;

  netIncome:
    number |
    null;

  cashFlow:
    number |
    null;

  cashBalance:
    number |
    null;

  mrr:
    number |
    null;

  customers:
    number |
    null;
};


export type ActualImportRow = {
  period:
    Date;

  revenue:
    number |
    null;

  cogs:
    number |
    null;

  operatingExpenses:
    number |
    null;

  ebitda:
    number |
    null;

  netIncome:
    number |
    null;

  cashFlow:
    number |
    null;

  cashBalance:
    number |
    null;

  mrr:
    number |
    null;

  customers:
    number |
    null;
};


export type MetricVariance = {
  actual:
    number;

  forecast:
    number;

  variance:
    number;

  varianceRate:
    number |
    null;

  favorable:
    boolean |
    null;
};


export type PeriodVariance = {
  period:
    string;

  metrics:
    Partial<
      Record<
        ActualMetric,
        MetricVariance
      >
    >;
};


export type VarianceSummary = {
  matchedPeriods:
    number;

  actualPeriods:
    number;

  revenueActual:
    number;

  revenueForecast:
    number;

  revenueVariance:
    number;

  revenueVarianceRate:
    number |
    null;

  ebitdaActual:
    number;

  ebitdaForecast:
    number;

  ebitdaVariance:
    number;

  ebitdaVarianceRate:
    number |
    null;

  latestCashActual:
    number |
    null;

  latestCashForecast:
    number |
    null;

  latestCashVariance:
    number |
    null;
};


export type ForecastVarianceReport = {
  periods:
    PeriodVariance[];

  summary:
    VarianceSummary;
};
