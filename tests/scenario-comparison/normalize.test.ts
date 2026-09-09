import {
  describe,
  expect,
  it,
} from "vitest";

import {
  extractScenarioCollection,
  normalizeScenarioCollection,
} from "@/lib/projects/scenario-comparison/normalize";


describe(
  "scenario normalization",
  () => {
    it(
      "extracts preferred scenarios collection",
      () => {
        const scenarios = [
          {
            id:
              "base",

            name:
              "Base",
          },
        ];


        expect(
          extractScenarioCollection({
            scenarios,
          }),
        ).toBe(
          scenarios,
        );
      },
    );


    it(
      "normalizes scenario metadata and drivers",
      () => {
        const result =
          normalizeScenarioCollection({
            scenarios: [
              {
                id:
                  "base",

                projectId:
                  "project-1",

                name:
                  "Base",

                isBase:
                  true,

                growth:
                  0.10,

                nested: {
                  churn:
                    0.03,
                },
              },
            ],
          });


        expect(
          result,
        ).toHaveLength(
          1,
        );


        expect(
          result[
            0
          ].id,
        ).toBe(
          "base",
        );


        expect(
          result[
            0
          ].name,
        ).toBe(
          "Base",
        );


        expect(
          result[
            0
          ].isBase,
        ).toBe(
          true,
        );


        expect(
          result[
            0
          ].snapshot,
        ).toEqual({
          growth:
            0.10,

          nested: {
            churn:
              0.03,
          },
        });
      },
    );


    it(
      "supports Decimal-like values",
      () => {
        const result =
          normalizeScenarioCollection([
            {
              id:
                "bull",

              name:
                "Bull",

              growth: {
                toNumber: () =>
                  0.25,
              },
            },
          ]);


        expect(
          result[
            0
          ].snapshot,
        ).toEqual({
          growth:
            0.25,
        });
      },
    );


    it(
      "uses the first scenario as Base fallback",
      () => {
        const result =
          normalizeScenarioCollection([
            {
              id:
                "a",

              name:
                "Scenario A",

              growth:
                0.1,
            },

            {
              id:
                "b",

              name:
                "Scenario B",

              growth:
                0.2,
            },
          ]);


        expect(
          result[
            0
          ].isBase,
        ).toBe(
          true,
        );


        expect(
          result[
            1
          ].isBase,
        ).toBe(
          false,
        );
      },
    );
  },
);
