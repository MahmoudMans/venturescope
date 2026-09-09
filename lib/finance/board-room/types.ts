import type {
  ExecutiveDecisionSignal,
} from "@/lib/finance/decision-center/types";


export type ExecutiveActionState = {
  status:
    string;

  priority:
    string;

  dueDate:
    string |
    null;
};


export type ExecutiveReviewKpis = {
  actualPeriods:
    number;

  matchedPeriods:
    number;

  revenueVarianceRate:
    number |
    null;

  ebitdaVarianceRate:
    number |
    null;

  forecastAccuracyScore:
    number |
    null;

  forecastWape:
    number |
    null;

  liquidityRiskLevel:
    "LOW" |
    "MODERATE" |
    "HIGH" |
    "CRITICAL";

  liquidityRiskScore:
    number;

  minimumForecastCash:
    number |
    null;

  minimumDownsideCash:
    number |
    null;

  downsideCashExhaustionPeriod:
    string |
    null;

  capitalNeed:
    number;
};


export type ExecutiveReviewActionSummary = {
  open:
    number;

  criticalOpen:
    number;

  overdue:
    number;

  done:
    number;
};


export type ExecutiveReviewSnapshot = {
  schemaVersion:
    1;

  capturedAt:
    string;

  kpis:
    ExecutiveReviewKpis;

  actions:
    ExecutiveReviewActionSummary;

  signals:
    ExecutiveDecisionSignal[];
};


export type ExecutiveReviewView = {
  id:
    string;

  periodKey:
    string;

  title:
    string;

  commentary:
    string |
    null;

  modelVersion:
    string;

  createdAt:
    string;

  createdBy:
    string |
    null;

  snapshot:
    ExecutiveReviewSnapshot;
};


export type ReviewComparisonMetric = {
  frozen:
    number |
    null;

  live:
    number |
    null;

  delta:
    number |
    null;
};


export type ExecutiveReviewComparison = {
  revenueVarianceRate:
    ReviewComparisonMetric;

  ebitdaVarianceRate:
    ReviewComparisonMetric;

  forecastAccuracyScore:
    ReviewComparisonMetric;

  liquidityRiskScore:
    ReviewComparisonMetric;

  capitalNeed:
    ReviewComparisonMetric;

  openActions:
    ReviewComparisonMetric;
};
