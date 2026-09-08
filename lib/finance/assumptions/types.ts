export type GrowthPeriod =
  | "MONTHLY"
  | "ANNUAL";

export type CogsMethod =
  | "PERCENTAGE"
  | "FIXED_MONTHLY";

export type AssumptionCompletion = {
  general: boolean;
  revenue: boolean;
  expenses: boolean;
};

export type GeneralAssumptions = {
  startingCash: string;
  corporateTaxRate: string;
};

export type DirectRevenueAssumptions = {
  startingMonthlyRevenue: string;
  monthlyGrowthRate: string;
  recurringRevenuePercentage: string;
  monthlyOneTimeRevenue: string;
};

export type CustomerRevenueAssumptions = {
  startingCustomers: string;
  arpu: string;
  monthlyChurnRate: string;
  cac: string;
  organicNewCustomers: string;
  customerAcquisitionGrowthRate: string;
  arpuGrowthRate: string;
  monthlyOneTimeRevenue: string;
};

export type SalaryAssumptions = {
  monthlyAmount: string;
  annualGrowthRate: string;
};

export type RentAssumptions = {
  monthlyAmount: string;
  annualGrowthRate: string;
};

export type MarketingAssumptions = {
  monthlyAmount: string;
  growthRate: string;
  growthPeriod: GrowthPeriod;
};

export type CogsAssumptions = {
  method: CogsMethod;
  percentage: string;
  fixedMonthlyAmount: string;
};

export type CustomOperatingExpense = {
  id: string;
  name: string;
  monthlyAmount: string;
};

export type OperatingExpenseAssumptions = {
  software: string;
  professionalServices: string;
  insurance: string;
  utilities: string;
  travel: string;
  other: string;
  custom: CustomOperatingExpense[];
};

export type ExpenseAssumptions = {
  salaries: SalaryAssumptions;
  rent: RentAssumptions;
  marketing: MarketingAssumptions;
  cogs: CogsAssumptions;
  operatingExpenses: OperatingExpenseAssumptions;
};

export type FinancialAssumptionsV1 = {
  version: 1;

  completion: AssumptionCompletion;

  general: GeneralAssumptions;

  directRevenue: DirectRevenueAssumptions;

  customerRevenue: CustomerRevenueAssumptions;

  expenses: ExpenseAssumptions;
};
