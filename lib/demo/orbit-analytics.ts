import type {
  FinancialAssumptionsV1,
} from "@/lib/finance/assumptions/types";
import {
  generateScenarioComparison,
} from "@/lib/finance/comparison";
import {
  generateFinancialForecast,
} from "@/lib/finance/engine";
import type {
  FinancialForecast,
  FinancialModelInput,
  FinancialScenarioInput,
  MonthlyOverrideInput,
  ScenarioComparisonItem,
} from "@/lib/finance/types";

export const ORBIT_ANALYTICS_DEMO_ID =
  "demo-orbit-analytics";

export const ORBIT_ANALYTICS_SCENARIOS: FinancialScenarioInput[] =
  [
    {
      id:
        "demo-base",

      name:
        "Base Case",

      type:
        "BASE",

      modifiers:
        {},
    },

    {
      id:
        "demo-bull",

      name:
        "Bull Case",

      type:
        "BULL",

      modifiers: {
        revenueGrowthMultiplier:
          "1.2",

        customerAcquisitionGrowthMultiplier:
          "1.2",

        arpuMultiplier:
          "1.05",

        cacMultiplier:
          "0.9",

        churnPercentagePointDelta:
          "-0.01",

        cogsPercentagePointDelta:
          "-0.02",
      },
    },

    {
      id:
        "demo-bear",

      name:
        "Bear Case",

      type:
        "BEAR",

      modifiers: {
        revenueGrowthMultiplier:
          "0.8",

        customerAcquisitionGrowthMultiplier:
          "0.8",

        arpuMultiplier:
          "0.95",

        cacMultiplier:
          "1.15",

        churnPercentagePointDelta:
          "0.02",

        cogsPercentagePointDelta:
          "0.03",
      },
    },
  ];

const ORBIT_ASSUMPTIONS: FinancialAssumptionsV1 =
  {
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
        "350000",

      corporateTaxRate:
        "25",
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
        "420",

      arpu:
        "149",

      monthlyChurnRate:
        "2.5",

      cac:
        "220",

      organicNewCustomers:
        "22",

      customerAcquisitionGrowthRate:
        "1.2",

      arpuGrowthRate:
        "0.35",

      monthlyOneTimeRevenue:
        "5000",
    },

    expenses: {
      salaries: {
        monthlyAmount:
          "72000",

        annualGrowthRate:
          "8",
      },

      rent: {
        monthlyAmount:
          "7500",

        annualGrowthRate:
          "3",
      },

      marketing: {
        monthlyAmount:
          "28000",

        growthRate:
          "1",

        growthPeriod:
          "MONTHLY",
      },

      cogs: {
        method:
          "PERCENTAGE",

        percentage:
          "16",

        fixedMonthlyAmount:
          "0",
      },

      operatingExpenses: {
        software:
          "8000",

        professionalServices:
          "6500",

        insurance:
          "3500",

        utilities:
          "2200",

        travel:
          "4000",

        other:
          "2500",

        custom: [
          {
            id:
              "orbit-data-provider",

            name:
              "Data providers",

            monthlyAmount:
              "1800",
          },
        ],
      },
    },
  };

const ORBIT_OVERRIDES: MonthlyOverrideInput[] =
  [
    {
      id:
        "demo-launch",

      projectId:
        ORBIT_ANALYTICS_DEMO_ID,

      scenarioId:
        null,

      month:
        "2027-09",

      values: {
        revenue:
          "185000",

        marketing:
          "65000",
      },

      note:
        "European product launch and paid acquisition campaign.",
    },

    {
      id:
        "demo-hiring",

      projectId:
        ORBIT_ANALYTICS_DEMO_ID,

      scenarioId:
        null,

      month:
        "2028-01",

      values: {
        salaries:
          "92000",
      },

      note:
        "Engineering and sales hiring expansion.",
    },

    {
      id:
        "demo-conference",

      projectId:
        ORBIT_ANALYTICS_DEMO_ID,

      scenarioId:
        null,

      month:
        "2028-06",

      values: {
        marketing:
          "80000",
      },

      note:
        "Annual industry conference and enterprise campaign.",
    },

    {
      id:
        "demo-bull-pricing",

      projectId:
        ORBIT_ANALYTICS_DEMO_ID,

      scenarioId:
        "demo-bull",

      month:
        "2028-03",

      values: {
        arpu:
          "175",

        churnRate:
          "1.8",
      },

      note:
        "Bull Case enterprise pricing and retention initiative.",
    },

    {
      id:
        "demo-bear-acquisition",

      projectId:
        ORBIT_ANALYTICS_DEMO_ID,

      scenarioId:
        "demo-bear",

      month:
        "2027-11",

      values: {
        cac:
          "340",

        churnRate:
          "4.5",

        marketing:
          "22000",
      },

      note:
        "Bear Case acquisition efficiency deterioration.",
    },
  ];

export function orbitAnalyticsDemoBaseInput(): FinancialModelInput {
  return {
    projectId:
      ORBIT_ANALYTICS_DEMO_ID,

    projectName:
      "Orbit Analytics",

    currency:
      "EUR",

    startMonth:
      "2027-01",

    horizonMonths:
      36,

    revenueMode:
      "CUSTOMER_DRIVEN",

    modelVersion:
      "1.0",

    assumptions:
      structuredClone(
        ORBIT_ASSUMPTIONS,
      ),

    financingEvents: [
      {
        id:
          "demo-equity",

        name:
          "Seed Extension",

        type:
          "EQUITY",

        month:
          "2027-06",

        amount:
          "700000",
      },

      {
        id:
          "demo-grant",

        name:
          "European Innovation Grant",

        type:
          "GRANT",

        month:
          "2027-10",

        amount:
          "120000",
      },

      {
        id:
          "demo-debt",

        name:
          "Growth Venture Debt",

        type:
          "DEBT",

        month:
          "2028-04",

        amount:
          "450000",

        apr:
          "7.5",

        termMonths:
          36,

        repaymentStartMonth:
          "2028-10",
      },
    ],

    monthlyOverrides:
      structuredClone(
        ORBIT_OVERRIDES,
      ),

    scenario:
      ORBIT_ANALYTICS_SCENARIOS[0],
  };
}

export function getOrbitAnalyticsScenario(
  scenarioId?:
    | string
    | null,
): FinancialScenarioInput {
  return (
    ORBIT_ANALYTICS_SCENARIOS.find(
      (
        scenario,
      ) =>
        scenario.id ===
        scenarioId,
    ) ??
    ORBIT_ANALYTICS_SCENARIOS[0]
  );
}

export function buildOrbitAnalyticsDemoForecast(
  scenarioId?:
    | string
    | null,
): FinancialForecast {
  const scenario =
    getOrbitAnalyticsScenario(
      scenarioId,
    );

  return generateFinancialForecast({
    ...orbitAnalyticsDemoBaseInput(),

    scenario,
  });
}

export function buildOrbitAnalyticsScenarioComparison(): ScenarioComparisonItem[] {
  const baseInput =
    orbitAnalyticsDemoBaseInput();

  return generateScenarioComparison(
    baseInput,
    ORBIT_ANALYTICS_SCENARIOS,
  );
}

export function orbitAnalyticsDemoAssumptions(): FinancialAssumptionsV1 {
  return structuredClone(
    ORBIT_ASSUMPTIONS,
  );
}

export function orbitAnalyticsDemoOverrideCount(): number {
  return ORBIT_OVERRIDES.length;
}
