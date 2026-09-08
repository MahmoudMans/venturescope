import {
  describe,
  expect,
  it,
} from "vitest";

import {
  registerSchema,
} from "@/lib/validation/auth";
import {
  customerRevenueAssumptionsFormSchema,
  directRevenueAssumptionsFormSchema,
  expenseAssumptionsFormSchema,
} from "@/lib/finance/assumptions/schemas";
import {
  createProjectSchema,
} from "@/lib/projects/project-validation";
import {
  createFinancingEventSchema,
} from "@/lib/financing/validation";
import {
  createScenarioSchema,
} from "@/lib/scenarios/validation";
import {
  createMonthlyOverrideSchema,
} from "@/lib/overrides/validation";
import {
  updateProjectSettingsSchema,
} from "@/lib/settings/validation";

describe(
  "VentureScope validation boundaries",
  () => {
    it(
      "normalizes registration email addresses",
      () => {
        const result =
          registerSchema.safeParse({
            name:
              "Alice Example",

            email:
              "  ALICE@EXAMPLE.COM ",

            password:
              "Secure123",

            confirmPassword:
              "Secure123",
          });

        expect(
          result.success,
        ).toBe(
          true,
        );

        if (
          result.success
        ) {
          expect(
            result.data.email,
          ).toBe(
            "alice@example.com",
          );
        }
      },
    );

    it(
      "rejects mismatched registration passwords",
      () => {
        const result =
          registerSchema.safeParse({
            name:
              "Alice Example",

            email:
              "alice@example.com",

            password:
              "Secure123",

            confirmPassword:
              "Secure124",
          });

        expect(
          result.success,
        ).toBe(
          false,
        );
      },
    );

    it(
      "accepts only supported project horizons",
      () => {
        const valid =
          createProjectSchema.safeParse({
            name:
              "Acme",

            industry:
              "",

            currency:
              "EUR",

            startMonth:
              "2027-01",

            horizonMonths:
              "36",

            revenueMode:
              "DIRECT",
          });

        const invalid =
          createProjectSchema.safeParse({
            name:
              "Acme",

            industry:
              "",

            currency:
              "EUR",

            startMonth:
              "2027-01",

            horizonMonths:
              "13",

            revenueMode:
              "DIRECT",
          });

        expect(
          valid.success,
        ).toBe(
          true,
        );

        expect(
          invalid.success,
        ).toBe(
          false,
        );
      },
    );

    it(
      "rejects recurring revenue above 100%",
      () => {
        expect(
          directRevenueAssumptionsFormSchema.safeParse({
            projectId:
              "project",

            startingMonthlyRevenue:
              "1000",

            monthlyGrowthRate:
              "10",

            recurringRevenuePercentage:
              "101",

            monthlyOneTimeRevenue:
              "0",
          }).success,
        ).toBe(
          false,
        );
      },
    );

    it(
      "requires CAC to remain strictly positive",
      () => {
        expect(
          customerRevenueAssumptionsFormSchema.safeParse({
            projectId:
              "project",

            startingCustomers:
              "100",

            arpu:
              "20",

            monthlyChurnRate:
              "5",

            cac:
              "0",

            organicNewCustomers:
              "10",

            customerAcquisitionGrowthRate:
              "0",

            arpuGrowthRate:
              "0",

            monthlyOneTimeRevenue:
              "0",
          }).success,
        ).toBe(
          false,
        );
      },
    );

    it(
      "rejects duplicate custom operating expense names case-insensitively",
      () => {
        const result =
          expenseAssumptionsFormSchema.safeParse({
            projectId:
              "project",

            salariesMonthly:
              "1000",

            salaryAnnualGrowthRate:
              "0",

            rentMonthly:
              "500",

            rentAnnualGrowthRate:
              "0",

            marketingMonthly:
              "200",

            marketingGrowthRate:
              "0",

            marketingGrowthPeriod:
              "MONTHLY",

            cogsMethod:
              "PERCENTAGE",

            cogsPercentage:
              "10",

            cogsFixedMonthly:
              "0",

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

            customExpenses: [
              {
                id:
                  "1",

                name:
                  "Cloud",

                monthlyAmount:
                  "100",
              },

              {
                id:
                  "2",

                name:
                  "cloud",

                monthlyAmount:
                  "200",
              },
            ],
          });

        expect(
          result.success,
        ).toBe(
          false,
        );
      },
    );

    it(
      "requires debt APR and term",
      () => {
        const result =
          createFinancingEventSchema.safeParse({
            projectId:
              "project",

            name:
              "Loan",

            type:
              "DEBT",

            month:
              "2027-01",

            amount:
              "10000",

            apr:
              "",

            termMonths:
              "",

            repaymentStartMonth:
              "",
          });

        expect(
          result.success,
        ).toBe(
          false,
        );
      },
    );

    it(
      "allows equity without debt fields",
      () => {
        const result =
          createFinancingEventSchema.safeParse({
            projectId:
              "project",

            name:
              "Seed",

            type:
              "EQUITY",

            month:
              "2027-01",

            amount:
              "10000",

            apr:
              "",

            termMonths:
              "",

            repaymentStartMonth:
              "",
          });

        expect(
          result.success,
        ).toBe(
          true,
        );
      },
    );

    it(
      "rejects impossible scenario multipliers",
      () => {
        const result =
          createScenarioSchema.safeParse({
            projectId:
              "project",

            name:
              "Impossible",

            growthAdjustmentPercentage:
              "-101",

            arpuAdjustmentPercentage:
              "0",

            cacAdjustmentPercentage:
              "0",

            churnDeltaPercentagePoints:
              "0",

            cogsDeltaPercentagePoints:
              "0",
          });

        expect(
          result.success,
        ).toBe(
          false,
        );
      },
    );

    it(
      "requires at least one actual monthly override",
      () => {
        const result =
          createMonthlyOverrideSchema.safeParse({
            projectId:
              "project",

            scenarioId:
              "",

            month:
              "2027-01",

            revenue:
              "",

            marketing:
              "",

            salaries:
              "",

            rent:
              "",

            cogs:
              "",

            cac:
              "",

            churnRate:
              "",

            arpu:
              "",

            note:
              "Only a note",
          });

        expect(
          result.success,
        ).toBe(
          false,
        );
      },
    );

    it(
      "treats a zero-value override as an intentional override",
      () => {
        const result =
          createMonthlyOverrideSchema.safeParse({
            projectId:
              "project",

            scenarioId:
              "",

            month:
              "2027-01",

            revenue:
              "0",

            marketing:
              "",

            salaries:
              "",

            rent:
              "",

            cogs:
              "",

            cac:
              "",

            churnRate:
              "",

            arpu:
              "",

            note:
              "",
          });

        expect(
          result.success,
        ).toBe(
          true,
        );
      },
    );

    it(
      "rejects unsupported Settings horizons",
      () => {
        const result =
          updateProjectSettingsSchema.safeParse({
            projectId:
              "project",

            name:
              "Acme",

            industry:
              "SaaS",

            currency:
              "EUR",

            startMonth:
              "2027-01",

            horizonMonths:
              "18",

            revenueMode:
              "DIRECT",
          });

        expect(
          result.success,
        ).toBe(
          false,
        );
      },
    );
  },
);
