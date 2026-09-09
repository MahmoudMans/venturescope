import type {
  ForecastAnalyticsRow,
} from "@/lib/finance/analytics/types";


export const BASELINE_KINDS = [
  "BUDGET",
  "FORECAST",
  "BOARD",
  "CUSTOM",
] as const;


export type ForecastBaselineKind =
  typeof BASELINE_KINDS[
    number
  ];


export type ForecastBaselineSnapshot = {
  schemaVersion:
    1;

  capturedAt:
    string;

  rows:
    ForecastAnalyticsRow[];
};


export type ForecastBaselineView = {
  id:
    string;

  name:
    string;

  kind:
    ForecastBaselineKind;

  modelVersion:
    string;

  createdAt:
    string;

  createdBy:
    string |
    null;

  snapshot:
    ForecastBaselineSnapshot;
};


export type PlanningMetric =
  | "revenue"
  | "cogs"
  | "operatingExpenses"
  | "ebitda"
  | "cashFlow"
  | "cashBalance"
  | "mrr";


export type RollingReforecastSource =
  | "ACTUAL"
  | "FORECAST";


export type RollingReforecastRow = {
  period:
    string;

  source:
    RollingReforecastSource;

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

  cashFlow:
    number |
    null;

  cashBalance:
    number |
    null;

  mrr:
    number |
    null;
};


export type PlanningComparisonMetric = {
  baseline:
    number |
    null;

  currentForecast:
    number |
    null;

  rollingReforecast:
    number |
    null;

  currentVsBaseline:
    number |
    null;

  rollingVsBaseline:
    number |
    null;

  currentVsBaselineRate:
    number |
    null;

  rollingVsBaselineRate:
    number |
    null;
};


export type PlanningCycleReport = {
  actualPeriodsUsed:
    number;

  forecastPeriodsUsed:
    number;

  metrics:
    Record<
      PlanningMetric,
      PlanningComparisonMetric
    >;

  rollingRows:
    RollingReforecastRow[];

  baselineRows:
    ForecastAnalyticsRow[];

  currentForecastRows:
    ForecastAnalyticsRow[];
};
