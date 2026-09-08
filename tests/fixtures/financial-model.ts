import type {
  FinancialAssumptionsV1,
} from "@/lib/finance/assumptions/types";
import type {
  FinancialModelInput,
} from "@/lib/finance/types";

export function createDirectAssumptions(): FinancialAssumptionsV1 {
  return {
    version:
      1,

    completion: {
      general:
        true,

      revenue:
        true,

      expenses:
        true,
    },

    general: {
      startingCash:
        "100000",

      corporateTaxRate:
        "20",
    },

    directRevenue: {
      startingMonthlyRevenue:
        "10000",

      monthlyGrowthRate:
        "10",

      recurringRevenuePercentage:
        "80",

      monthlyOneTimeRevenue:
        "1000",
    },

    customerRevenue: {
      startingCustomers:
        "0",

      arpu:
        "0",

      monthlyChurnRate:
        "0",

      cac:
        "100",

      organicNewCustomers:
        "0",

      customerAcquisitionGrowthRate:
        "0",

      arpuGrowthRate:
        "0",

      monthlyOneTimeRevenue:
        "0",
    },

    expenses: {
      salaries: {
        monthlyAmount:
          "1000",

        annualGrowthRate:
          "0",
      },

      rent: {
        monthlyAmount:
          "500",

        annualGrowthRate:
          "0",
      },

      marketing: {
        monthlyAmount:
          "500",

        growthRate:
          "0",

        growthPeriod:
          "MONTHLY",
      },

      cogs: {
        method:
          "PERCENTAGE",

        percentage:
          "10",

        fixedMonthlyAmount:
          "0",
      },

      operatingExpenses: {
        software:
          "0",

        professionalServices:
          "0",

        insurance:
          "0",

        utilities:
          "0",

        travel:
          "0",

        other:
          "0",

        custom:
          [],
      },
    },
  };
}

export function createCustomerAssumptions(): FinancialAssumptionsV1 {
  return {
    version:
      1,

    completion: {
      general:
        true,

      revenue:
        true,

      expenses:
        true,
    },

    general: {
      startingCash:
        "10000",

      corporateTaxRate:
        "0",
    },

    directRevenue: {
      startingMonthlyRevenue:
        "0",

      monthlyGrowthRate:
        "0",

      recurringRevenuePercentage:
        "100",

      monthlyOneTimeRevenue:
        "0",
    },

    customerRevenue: {
      startingCustomers:
        "100",

      arpu:
        "20",

      monthlyChurnRate:
        "10",

      cac:
        "100",

      organicNewCustomers:
        "5",

      customerAcquisitionGrowthRate:
        "0",

      arpuGrowthRate:
        "0",

      monthlyOneTimeRevenue:
        "0",
    },

    expenses: {
      salaries: {
        monthlyAmount:
          "0",

        annualGrowthRate:
          "0",
      },

      rent: {
        monthlyAmount:
          "0",

        annualGrowthRate:
          "0",
      },

      marketing: {
        monthlyAmount:
          "1000",

        growthRate:
          "0",

        growthPeriod:
          "MONTHLY",
      },

      cogs: {
        method:
          "PERCENTAGE",

        percentage:
          "0",

        fixedMonthlyAmount:
          "0",
      },

      operatingExpenses: {
        software:
          "0",

        professionalServices:
          "0",

        insurance:
          "0",

        utilities:
          "0",

        travel:
          "0",

        other:
          "0",

        custom:
          [],
      },
    },
  };
}

export function createDirectModelInput(): FinancialModelInput {
  return {
    projectId:
      "direct-project",

    projectName:
      "Direct Test Company",

    currency:
      "EUR",

    startMonth:
      "2027-01",

    horizonMonths:
      12,

    revenueMode:
      "DIRECT",

    modelVersion:
      "1.0",

    assumptions:
      createDirectAssumptions(),

    financingEvents:
      [],

    monthlyOverrides:
      [],

    scenario: {
      id:
        "base",

      name:
        "Base Case",

      type:
        "BASE",

      modifiers:
        {},
    },
  };
}

export function createCustomerModelInput(): FinancialModelInput {
  return {
    projectId:
      "customer-project",

    projectName:
      "Customer Test Company",

    currency:
      "EUR",

    startMonth:
      "2027-01",

    horizonMonths:
      12,

    revenueMode:
      "CUSTOMER_DRIVEN",

    modelVersion:
      "1.0",

    assumptions:
      createCustomerAssumptions(),

    financingEvents:
      [],

    monthlyOverrides:
      [],

    scenario: {
      id:
        "base",

      name:
        "Base Case",

      type:
        "BASE",

      modifiers:
        {},
    },
  };
}
