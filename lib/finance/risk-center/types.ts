export type ProjectRiskPolicy = {
  minimumCash:
    number |
    null;

  minimumRunwayMonths:
    number;

  minimumEbitdaMargin:
    number |
    null;

  maximumMonthlyBurn:
    number |
    null;

  downsideRevenueShock:
    number;

  downsideCostInflation:
    number;
};


export type LiquidityRiskLevel =
  | "LOW"
  | "MODERATE"
  | "HIGH"
  | "CRITICAL";


export type GuardrailState =
  | "PASS"
  | "WARNING"
  | "BREACH"
  | "UNAVAILABLE";


export type RiskGuardrail = {
  code:
    string;

  label:
    string;

  state:
    GuardrailState;

  current:
    number |
    null;

  threshold:
    number |
    null;

  breachPeriod:
    string |
    null;

  message:
    string;
};


export type DownsideCashPeriod = {
  period:
    string;

  baselineCashFlow:
    number;

  stressedCashFlow:
    number;

  stressedCashBalance:
    number;
};


export type LiquidityRiskReport = {
  score:
    number;

  level:
    LiquidityRiskLevel;

  forecastPeriods:
    number;

  latestActualPeriod:
    string |
    null;

  latestActualCash:
    number |
    null;

  runwayMonths:
    number |
    null;

  firstCashExhaustionPeriod:
    string |
    null;

  firstMinimumCashBreachPeriod:
    string |
    null;

  firstDownsideCashExhaustionPeriod:
    string |
    null;

  minimumForecastCash:
    number |
    null;

  minimumDownsideCash:
    number |
    null;

  maximumMonthlyBurn:
    number |
    null;

  minimumEbitdaMargin:
    number |
    null;

  guardrails:
    RiskGuardrail[];

  downsideCash:
    DownsideCashPeriod[];
};
