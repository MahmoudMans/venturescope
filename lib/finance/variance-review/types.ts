export const VARIANCE_METRIC_CODES = [
  "REVENUE",
  "COGS",
  "OPERATING_EXPENSES",
  "EBITDA",
  "NET_INCOME",
  "CASH_FLOW",
  "CASH_BALANCE",
  "MRR",
  "CUSTOMERS",
] as const;


export type VarianceMetricCode =
  typeof VARIANCE_METRIC_CODES[
    number
  ];


export const VARIANCE_CAUSE_CODES = [
  "VOLUME",
  "PRICE",
  "MIX",
  "TIMING",
  "CHURN_RETENTION",
  "INPUT_COST",
  "HEADCOUNT",
  "MARKETING",
  "OTHER_OPEX",
  "WORKING_CAPITAL",
  "ONE_OFF",
  "ACCOUNTING_CLASSIFICATION",
  "OTHER",
] as const;


export type VarianceCauseCode =
  typeof VARIANCE_CAUSE_CODES[
    number
  ];


export const VARIANCE_NATURES = [
  "ONE_OFF",
  "RECURRING",
  "STRUCTURAL",
  "UNKNOWN",
] as const;


export type VarianceNature =
  typeof VARIANCE_NATURES[
    number
  ];


export const VARIANCE_COMMENTARY_STATUSES = [
  "OPEN",
  "MONITORING",
  "RESOLVED",
  "ACCEPTED",
] as const;


export type VarianceCommentaryStatus =
  typeof VARIANCE_COMMENTARY_STATUSES[
    number
  ];


export type VarianceFavorability =
  | "FAVORABLE"
  | "UNFAVORABLE"
  | "NEUTRAL"
  | "UNAVAILABLE";


export type VarianceMateriality =
  | "MATERIAL"
  | "REVIEW"
  | "IMMATERIAL"
  | "UNAVAILABLE";


export type VarianceCommentaryView = {
  id:
    string;

  periodKey:
    string;

  metricCode:
    VarianceMetricCode;

  causeCode:
    VarianceCauseCode;

  varianceNature:
    VarianceNature;

  explanation:
    string;

  correctiveAction:
    string |
    null;

  ownerName:
    string |
    null;

  recoveryPeriodKey:
    string |
    null;

  status:
    VarianceCommentaryStatus;

  createdAt:
    string;

  updatedAt:
    string;

  createdBy:
    string |
    null;
};


export type VarianceReviewRow = {
  key:
    string;

  periodKey:
    string;

  metricCode:
    VarianceMetricCode;

  actual:
    number |
    null;

  forecast:
    number |
    null;

  variance:
    number |
    null;

  varianceRate:
    number |
    null;

  favorability:
    VarianceFavorability;

  materiality:
    VarianceMateriality;

  commentary:
    VarianceCommentaryView |
    null;
};


export type VarianceReviewSummary = {
  totalRows:
    number;

  material:
    number;

  materialUnexplained:
    number;

  unfavorable:
    number;

  openCommentaries:
    number;

  monitoringCommentaries:
    number;

  resolvedCommentaries:
    number;

  acceptedCommentaries:
    number;

  reviewedPeriods:
    number;
};


export type VarianceReview = {
  rows:
    VarianceReviewRow[];

  summary:
    VarianceReviewSummary;
};
