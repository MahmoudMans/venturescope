export const KPI_METRIC_CODES = [
  "REVENUE",
  "EBITDA_MARGIN",
  "CASH_BALANCE",
  "MRR",
  "CUSTOMERS",
  "RUNWAY_MONTHS",
  "FORECAST_ACCURACY",
] as const;


export type KpiMetricCode =
  typeof KPI_METRIC_CODES[
    number
  ];


export type KpiTargetStatus =
  | "ON_TRACK"
  | "AT_RISK"
  | "OFF_TRACK"
  | "UNAVAILABLE";


export type KpiValueSource =
  | "ACTUAL"
  | "FORECAST"
  | "LIVE_ANALYTICS"
  | "UNAVAILABLE";


export type KpiTargetView = {
  id:
    string;

  periodKey:
    string;

  metricCode:
    KpiMetricCode;

  targetValue:
    number;

  ownerName:
    string |
    null;

  note:
    string |
    null;

  createdAt:
    string;

  updatedAt:
    string;

  createdBy:
    string |
    null;
};


export type KpiScorecardRow = {
  target:
    KpiTargetView;

  currentValue:
    number |
    null;

  source:
    KpiValueSource;

  status:
    KpiTargetStatus;

  gap:
    number |
    null;

  atRiskThreshold:
    number;
};


export type KpiScorecardSummary = {
  total:
    number;

  onTrack:
    number;

  atRisk:
    number;

  offTrack:
    number;

  unavailable:
    number;

  trackedPeriods:
    number;
};


export type ManagementScorecard = {
  rows:
    KpiScorecardRow[];

  summary:
    KpiScorecardSummary;
};
