import {
  describe,
  expect,
  it,
} from "vitest";

import {
  applyScenarioToAssumptions,
} from "@/lib/finance/scenario-engine";
import {
  createCustomerAssumptions,
  createDirectAssumptions,
} from "@/tests/fixtures/financial-model";

const bullScenario =
  {
    id:
      "bull",

    name:
      "Bull Case",

    type:
      "BULL" as const,

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
  };

describe(
  "scenario engine",
  () => {
    it(
      "does not mutate persisted Base assumptions",
      () => {
        const original =
          createDirectAssumptions();

        const before =
          structuredClone(
            original,
          );

        applyScenarioToAssumptions(
          original,
          "DIRECT",
          bullScenario,
        );

        expect(
          original,
        ).toEqual(
          before,
        );
      },
    );

    it(
      "adjusts direct revenue growth and COGS",
      () => {
        const result =
          applyScenarioToAssumptions(
            createDirectAssumptions(),
            "DIRECT",
            bullScenario,
          );

        expect(
          result.directRevenue
            .monthlyGrowthRate,
        ).toBe(
          "12",
        );

        expect(
          result.expenses.cogs
            .percentage,
        ).toBe(
          "8",
        );
      },
    );

    it(
      "adjusts customer economics using relative and percentage-point semantics",
      () => {
        const result =
          applyScenarioToAssumptions(
            createCustomerAssumptions(),
            "CUSTOMER_DRIVEN",
            bullScenario,
          );

        expect(
          result.customerRevenue
            .arpu,
        ).toBe(
          "21",
        );

        expect(
          result.customerRevenue
            .cac,
        ).toBe(
          "90",
        );

        expect(
          result.customerRevenue
            .monthlyChurnRate,
        ).toBe(
          "9",
        );
      },
    );

    it(
      "leaves Base Case assumptions unchanged",
      () => {
        const assumptions =
          createCustomerAssumptions();

        expect(
          applyScenarioToAssumptions(
            assumptions,
            "CUSTOMER_DRIVEN",
            {
              name:
                "Base Case",

              type:
                "BASE",

              modifiers:
                {},
            },
          ),
        ).toEqual(
          assumptions,
        );
      },
    );
  },
);
