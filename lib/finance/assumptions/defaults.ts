import type {
  FinancialAssumptionsV1,
} from "@/lib/finance/assumptions/types";

export const DEFAULT_FINANCIAL_ASSUMPTIONS: FinancialAssumptionsV1 =
  {
    version: 1,

    completion: {
      general: false,
      revenue: false,
      expenses: false,
    },

    general: {
      startingCash: "0",
      corporateTaxRate: "0",
    },

    directRevenue: {
      startingMonthlyRevenue: "0",
      monthlyGrowthRate: "0",
      recurringRevenuePercentage: "100",
      monthlyOneTimeRevenue: "0",
    },

    customerRevenue: {
      startingCustomers: "0",
      arpu: "0",
      monthlyChurnRate: "0",
      cac: "1",
      organicNewCustomers: "0",
      customerAcquisitionGrowthRate: "0",
      arpuGrowthRate: "0",
      monthlyOneTimeRevenue: "0",
    },

    expenses: {
      salaries: {
        monthlyAmount: "0",
        annualGrowthRate: "0",
      },

      rent: {
        monthlyAmount: "0",
        annualGrowthRate: "0",
      },

      marketing: {
        monthlyAmount: "0",
        growthRate: "0",
        growthPeriod: "MONTHLY",
      },

      cogs: {
        method: "PERCENTAGE",
        percentage: "0",
        fixedMonthlyAmount: "0",
      },

      operatingExpenses: {
        software: "0",
        professionalServices: "0",
        insurance: "0",
        utilities: "0",
        travel: "0",
        other: "0",
        custom: [],
      },
    },
  };

export function createDefaultFinancialAssumptions(): FinancialAssumptionsV1 {
  return structuredClone(
    DEFAULT_FINANCIAL_ASSUMPTIONS,
  );
}
