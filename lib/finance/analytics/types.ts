export type ForecastAnalyticsRow = {
  period:
    string;

  revenue:
    number |
    null;

  cogs:
    number |
    null;

  grossProfit:
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

  cac:
    number |
    null;

  churnRate:
    number |
    null;
};


export type DcfAssumptions = {
  discountRate:
    number;

  terminalGrowthRate:
    number;
};


export type AnnualCashFlow = {
  year:
    number;

  freeCashFlow:
    number;

  revenue:
    number;

  ebitda:
    number;
};


export type DcfResult = {
  enterpriseValue:
    number;

  equityValueProxy:
    number;

  presentValueOfForecast:
    number;

  presentValueOfTerminalValue:
    number;

  terminalValue:
    number;

  annualCashFlows:
    AnnualCashFlow[];
};


export type SensitivityCell = {
  discountRate:
    number;

  terminalGrowthRate:
    number;

  enterpriseValue:
    number |
    null;
};


export type DcfSensitivityMatrix = {
  discountRates:
    number[];

  terminalGrowthRates:
    number[];

  cells:
    SensitivityCell[];
};


export type UnitEconomics = {
  monthlyArpu:
    number |
    null;

  grossMarginRate:
    number |
    null;

  lifetimeValue:
    number |
    null;

  cac:
    number |
    null;

  ltvToCac:
    number |
    null;

  cacPaybackMonths:
    number |
    null;

  churnRate:
    number |
    null;
};


export type OperatingAnalytics = {
  trailingRevenue:
    number;

  trailingEbitda:
    number;

  revenueGrowthRate:
    number |
    null;

  ebitdaMarginRate:
    number |
    null;

  contributionMarginRate:
    number |
    null;

  ruleOf40:
    number |
    null;

  burnMultiple:
    number |
    null;

  endingCashBalance:
    number |
    null;
};


export type AdvancedFinancialAnalytics = {
  rowCount:
    number;

  dcf:
    DcfResult |
    null;

  sensitivity:
    DcfSensitivityMatrix;

  unitEconomics:
    UnitEconomics;

  operating:
    OperatingAnalytics;
};
