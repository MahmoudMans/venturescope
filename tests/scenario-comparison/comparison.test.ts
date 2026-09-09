import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildScenarioDecisionMatrix,
  cleanScenarioChangePath,
  compareScenarios,
} from "@/lib/projects/scenario-comparison/comparison";

import type {
  ScenarioComparisonView,
} from "@/lib/projects/scenario-comparison/types";


function scenario({
  id,
  name,
  snapshot,
  isBase =
    false,
}: {
  id:
    string;

  name:
    string;

  snapshot:
    ScenarioComparisonView[
      "snapshot"
    ];

  isBase?:
    boolean;
}): ScenarioComparisonView {
  return {
    id,

    name,

    isBase,

    snapshot,
  };
}


describe(
  "scenario comparison",
  () => {
    it(
      "detects numeric increases and decreases",
      () => {
        const result =
          compareScenarios(
            scenario({
              id:
                "base",

              name:
                "Base",

              isBase:
                true,

              snapshot: {
                growth:
                  0.10,

                churn:
                  0.05,
              },
            }),

            scenario({
              id:
                "bull",

              name:
                "Bull",

              snapshot: {
                growth:
                  0.20,

                churn:
                  0.03,
              },
            }),
          );


        expect(
          result.summary
            .totalChanges,
        ).toBe(
          2,
        );


        expect(
          result.summary
            .numericIncreases,
        ).toBe(
          1,
        );


        expect(
          result.summary
            .numericDecreases,
        ).toBe(
          1,
        );
      },
    );


    it(
      "detects structural changes",
      () => {
        const result =
          compareScenarios(
            scenario({
              id:
                "base",

              name:
                "Base",

              snapshot: {
                growth:
                  0.10,
              },
            }),

            scenario({
              id:
                "custom",

              name:
                "Custom",

              snapshot: {
                growth:
                  0.10,

                retention:
                  0.90,
              },
            }),
          );


        expect(
          result.summary
            .added,
        ).toBe(
          1,
        );


        expect(
          result.summary
            .structuralChanges,
        ).toBe(
          1,
        );
      },
    );


    it(
      "does not flag stable nested identity-array reordering",
      () => {
        const result =
          compareScenarios(
            scenario({
              id:
                "base",

              name:
                "Base",

              snapshot: {
                tiers: [
                  {
                    id:
                      "a",

                    price:
                      10,
                  },

                  {
                    id:
                      "b",

                    price:
                      20,
                  },
                ],
              },
            }),

            scenario({
              id:
                "other",

              name:
                "Other",

              snapshot: {
                tiers: [
                  {
                    id:
                      "b",

                    price:
                      20,
                  },

                  {
                    id:
                      "a",

                    price:
                      10,
                  },
                ],
              },
            }),
          );


        expect(
          result.summary
            .totalChanges,
        ).toBe(
          0,
        );
      },
    );


    it(
      "builds decision matrix relative to selected reference",
      () => {
        const base =
          scenario({
            id:
              "base",

            name:
              "Base",

            isBase:
              true,

            snapshot: {
              growth:
                0.10,
            },
          });


        const bull =
          scenario({
            id:
              "bull",

            name:
              "Bull",

            snapshot: {
              growth:
                0.20,
            },
          });


        const matrix =
          buildScenarioDecisionMatrix(
            base,
            [
              base,
              bull,
            ],
          );


        expect(
          matrix[
            0
          ].isReference,
        ).toBe(
          true,
        );


        expect(
          matrix[
            0
          ].divergence,
        ).toBe(
          "IDENTICAL",
        );


        expect(
          matrix[
            1
          ].totalChanges,
        ).toBe(
          1,
        );
      },
    );


    it(
      "cleans internal comparison wrapper from paths",
      () => {
        expect(
          cleanScenarioChangePath(
            "$.scenarios[id:comparison].config.growth",
          ),
        ).toBe(
          "$.growth",
        );
      },
    );
  },
);
