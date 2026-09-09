export const DECISION_ACTION_PRIORITIES = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const;


export type DecisionActionPriority =
  typeof DECISION_ACTION_PRIORITIES[
    number
  ];


export const DECISION_ACTION_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "BLOCKED",
  "DONE",
  "DISMISSED",
] as const;


export type DecisionActionStatus =
  typeof DECISION_ACTION_STATUSES[
    number
  ];


export const DECISION_SOURCE_CODES = [
  "MANUAL",
  "NO_ACTUALS",
  "LIQUIDITY_RISK",
  "DOWNSIDE_EXHAUSTION",
  "CAPITAL_GAP",
  "FORECAST_ACCURACY",
  "REVENUE_VARIANCE",
  "EBITDA_VARIANCE",
  "FORECAST_BIAS",
] as const;


export type DecisionSourceCode =
  typeof DECISION_SOURCE_CODES[
    number
  ];


export type DecisionSignalSeverity =
  | "INFO"
  | "WARNING"
  | "CRITICAL";


export type DecisionSignalCategory =
  | "PERFORMANCE"
  | "FORECAST"
  | "LIQUIDITY"
  | "CAPITAL";


export type ExecutiveDecisionInputs = {
  actualPeriods:
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

  forecastBiasCount:
    number;

  liquidityRiskLevel:
    "LOW" |
    "MODERATE" |
    "HIGH" |
    "CRITICAL";

  downsideCashExhaustionPeriod:
    string |
    null;

  requiredCapital:
    number;
};


export type ExecutiveDecisionSignal = {
  code:
    DecisionSourceCode;

  category:
    DecisionSignalCategory;

  severity:
    DecisionSignalSeverity;

  title:
    string;

  message:
    string;

  actionHint:
    string;

  hrefSuffix:
    string;
};


export type DecisionActionView = {
  id:
    string;

  title:
    string;

  details:
    string |
    null;

  sourceCode:
    DecisionSourceCode |
    null;

  priority:
    DecisionActionPriority;

  status:
    DecisionActionStatus;

  ownerName:
    string |
    null;

  dueDate:
    string |
    null;

  createdAt:
    string;

  createdBy:
    string |
    null;
};
