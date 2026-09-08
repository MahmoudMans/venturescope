export {
  aggregateAnnualForecast,
} from "@/lib/finance/aggregation";

export {
  aggregateCashAnalytics,
  calculateCashForecastSummary,
} from "@/lib/finance/cash-analytics";

export type {
  AnnualCashAnalytics,
  CashForecastSummary,
} from "@/lib/finance/cash-analytics";

export {
  generateScenarioComparison,
} from "@/lib/finance/comparison";

export {
  aggregateCustomerAnalytics,
  calculateCustomerForecastSummary,
} from "@/lib/finance/customer-analytics";

export type {
  AnnualCustomerAnalytics,
  CustomerForecastSummary,
} from "@/lib/finance/customer-analytics";

export {
  calculateCustomerRevenueMonth,
} from "@/lib/finance/customer-engine";

export {
  addMonths,
  compareMonths,
  dateToMonthKey,
  enumerateMonths,
  monthDistance,
  monthKeyToSerial,
  monthNumberFromMonth,
  serialToMonthKey,
  yearFromMonth,
} from "@/lib/finance/dates";

export {
  generateFinancialForecast,
} from "@/lib/finance/engine";

export {
  calculateCogs,
  calculateMonthlyExpenseProfile,
} from "@/lib/finance/expense-engine";

export {
  calculateFinancingForMonth,
} from "@/lib/finance/financing-engine";

export {
  formatCompactCurrencyValue,
  formatCurrencyValue,
  formatCustomerValue,
  formatExpenseCurrencyValue,
  formatLongMonthKey,
  formatMonthKey,
  formatNumberValue,
  formatPercentageValue,
  formatRunway,
  formatRunwayDetail,
  resolveAnalysisTableView,
} from "@/lib/finance/formatting";

export type {
  AnalysisTableView,
} from "@/lib/finance/formatting";

export {
  calculateFinancialMetrics,
} from "@/lib/finance/metrics";

export {
  buildFinancialModelInput,
  mapPersistedScenario,
} from "@/lib/finance/project-input";

export {
  calculateDirectRevenueMonth,
} from "@/lib/finance/revenue-engine";

export {
  applyScenarioToAssumptions,
  parseScenarioModifiers,
} from "@/lib/finance/scenario-engine";

export type {
  AnnualForecast,
  BreakEvenResult,
  FinancialForecast,
  FinancialMetrics,
  FinancialModelInput,
  FinancialScenarioInput,
  FinancingEventInput,
  FinancingInflowBreakdown,
  FinancingType,
  MonthKey,
  MonthlyForecast,
  OperatingExpenseBreakdown,
  RevenueMode,
  RunwayResult,
  RunwayStatus,
  ScenarioComparisonItem,
  ScenarioType,
} from "@/lib/finance/types";
