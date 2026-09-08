import type {
  FinancialAssumptionsV1,
} from "@/lib/finance/assumptions/types";

export type MonthKey = string;

export type RevenueMode =
  | "DIRECT"
  | "CUSTOMER_DRIVEN";

export type ScenarioType =
  | "BASE"
  | "BULL"
  | "BEAR"
  | "CUSTOM";

export type FinancingType =
  | "EQUITY"
  | "DEBT"
  | "GRANT"
  | "OTHER";

export type FinancialScenarioInput = {
  id?: string;
  name: string;
  type: ScenarioType;
  modifiers?: unknown;
};

export type FinancingEventInput = {
  id?: string;
  name: string;
  type: FinancingType;

  month: MonthKey;
  amount: string;

  apr?: string | null;
  termMonths?: number | null;
  repaymentStartMonth?: MonthKey | null;
};

export type FinancialModelInput = {
  projectId: string;
  projectName: string;

  currency: string;

  startMonth: MonthKey;
  horizonMonths: number;

  revenueMode: RevenueMode;

  modelVersion: string;

  assumptions: FinancialAssumptionsV1;

  financingEvents?: FinancingEventInput[];

  scenario?: FinancialScenarioInput;
};

export type OperatingExpenseBreakdown = {
  software: string;
  professionalServices: string;
  insurance: string;
  utilities: string;
  travel: string;
  other: string;
  custom: string;
};

export type FinancingInflowBreakdown = {
  equity: string;
  debt: string;
  grant: string;
  other: string;
  total: string;
};

export type MonthlyForecast = {
  index: number;

  month: MonthKey;
  year: number;
  monthNumber: number;

  openingCustomers: string | null;
  paidNewCustomers: string | null;
  organicNewCustomers: string | null;
  newCustomers: string | null;
  churnedCustomers: string | null;
  endingCustomers: string | null;

  arpu: string | null;

  mrr: string;

  recurringRevenue: string;
  nonRecurringRevenue: string;
  oneTimeRevenue: string;
  revenue: string;

  cogs: string;
  grossProfit: string;
  grossMarginPercentage: string | null;

  salaries: string;
  rent: string;
  marketing: string;

  operatingExpenseBreakdown: OperatingExpenseBreakdown;

  otherOperatingExpenses: string;
  totalOperatingExpenses: string;

  ebitda: string;
  ebitdaMarginPercentage: string | null;

  interestExpense: string;

  profitBeforeTax: string;
  tax: string;
  netIncome: string;
  netMarginPercentage: string | null;

  operatingCashInflow: string;
  operatingCashOutflow: string;
  operatingCashFlow: string;

  financingInflows: FinancingInflowBreakdown;

  debtPrincipalRepayment: string;

  openingCash: string;
  netCashMovement: string;
  endingCash: string;

  grossBurn: string;
  netBurn: string;

  breakEvenRevenue: string | null;
};

export type AnnualForecast = {
  year: number;
  monthsIncluded: number;

  revenue: string;
  recurringRevenue: string;
  oneTimeRevenue: string;

  cogs: string;
  grossProfit: string;
  grossMarginPercentage: string | null;

  salaries: string;
  rent: string;
  marketing: string;
  otherOperatingExpenses: string;
  totalOperatingExpenses: string;

  ebitda: string;
  ebitdaMarginPercentage: string | null;

  interestExpense: string;
  tax: string;
  netIncome: string;
  netMarginPercentage: string | null;

  operatingCashFlow: string;

  financingInflow: string;
  debtPrincipalRepayment: string;

  netCashMovement: string;

  endingCash: string;
  endingMrr: string;
  endingCustomers: string | null;

  averageGrossBurn: string;
  averageNetBurn: string;
};

export type RunwayStatus =
  | "ZERO"
  | "EXHAUSTED"
  | "BEYOND_HORIZON"
  | "CASH_FLOW_POSITIVE";

export type RunwayResult = {
  status: RunwayStatus;

  months: number | null;

  exhaustedMonth: MonthKey | null;

  horizonMonths: number;
};

export type BreakEvenResult = {
  firstEbitdaBreakEvenMonth: MonthKey | null;

  sustainedBreakEvenMonth: MonthKey | null;

  sustainedMonthsRequired: number;
};

export type FinancialMetrics = {
  totalRevenue: string;
  totalGrossProfit: string;
  totalEbitda: string;
  totalNetIncome: string;

  firstYearRevenue: string;
  firstYearEbitda: string;

  endingCash: string;

  endingMrr: string;
  endingArr: string;

  endingCustomers: string | null;

  grossMarginPercentage: string | null;
  ebitdaMarginPercentage: string | null;
  netMarginPercentage: string | null;

  initialThreeMonthAverageGrossBurn: string;
  initialThreeMonthAverageNetBurn: string;

  initialBreakEvenRevenue: string | null;

  runway: RunwayResult;

  breakEven: BreakEvenResult;
};

export type FinancialForecast = {
  projectId: string;
  projectName: string;

  currency: string;

  revenueMode: RevenueMode;

  modelVersion: string;

  startMonth: MonthKey;
  horizonMonths: number;

  scenario: {
    id?: string;
    name: string;
    type: ScenarioType;
  };

  months: MonthlyForecast[];

  annual: AnnualForecast[];

  metrics: FinancialMetrics;
};

export type ScenarioComparisonItem = {
  scenarioId?: string;

  scenarioName: string;
  scenarioType: ScenarioType;

  firstYearRevenue: string;
  firstYearEbitda: string;

  endingCash: string;
  endingMrr: string;
  endingCustomers: string | null;

  runway: RunwayResult;

  firstEbitdaBreakEvenMonth: MonthKey | null;
  sustainedBreakEvenMonth: MonthKey | null;
};
