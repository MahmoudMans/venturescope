import {
  describe,
  expect,
  it,
} from "vitest";

import {
  compareScenarios,
} from "@/lib/projects/scenario-comparison/comparison";

import type {
  ScenarioComparisonView,
} from "@/lib/projects/scenario-comparison/types";


function view(
  id:
    string,
  snapshot:
    ScenarioComparisonView[
      "snapshot"
    ],
): ScenarioComparisonView {
  return {
    id,

    name:
      id,

    isBase:
      id ===
      "base",

    snapshot,
  };
}


describe(
  "scenario divergence",
  () => {
    it(
      "classifies identical scenarios",
      () => {
        expect(
          compareScenarios(
            view(
              "base",
              {
                a:
                  1,
              },
            ),
            view(
              "same",
              {
                a:
                  1,
              },
            ),
          ).summary.divergence,
        ).toBe(
          "IDENTICAL",
        );
      },
    );


    it(
      "classifies low divergence",
      () => {
        expect(
          compareScenarios(
            view(
              "base",
              {
                a:
                  1,

                b:
                  2,
              },
            ),
            view(
              "other",
              {
                a:
                  2,

                b:
                  2,
              },
            ),
          ).summary.divergence,
        ).toBe(
          "LOW",
        );
      },
    );


    it(
      "classifies high divergence for many driver changes",
      () => {
        const before = {
          a:
            1,

          b:
            1,

          c:
            1,

          d:
            1,

          e:
            1,

          f:
            1,
        };


        const after = {
          a:
            2,

          b:
            2,

          c:
            2,

          d:
            2,

          e:
            2,

          f:
            2,
        };


        expect(
          compareScenarios(
            view(
              "base",
              before,
            ),
            view(
              "other",
              after,
            ),
          ).summary.divergence,
        ).toBe(
          "HIGH",
        );
      },
    );
  },
);
