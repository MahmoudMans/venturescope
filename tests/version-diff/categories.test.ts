import {
  describe,
  expect,
  it,
} from "vitest";

import {
  compareRevisionSnapshots,
} from "@/lib/projects/version-diff/diff";

import type {
  JsonValue,
  RevisionDiffView,
} from "@/lib/projects/version-diff/types";


function revision(
  version:
    number,
  snapshot:
    JsonValue,
): RevisionDiffView {
  return {
    id:
      String(
        version,
      ),

    version,

    label:
      null,

    reason:
      null,

    sourceRevisionId:
      null,

    createdAt:
      "2027-01-01T00:00:00.000Z",

    snapshot,
  };
}


describe(
  "model change intelligence",
  () => {
    it(
      "categorizes scenarios",
      () => {
        const diff =
          compareRevisionSnapshots(
            revision(
              1,
              {
                scenarios: [
                  {
                    id:
                      "base",

                    modifiers: {
                      growth:
                        1,
                    },
                  },
                ],
              },
            ),
            revision(
              2,
              {
                scenarios: [
                  {
                    id:
                      "base",

                    modifiers: {
                      growth:
                        1.2,
                    },
                  },
                ],
              },
            ),
          );


        expect(
          diff.summary
            .scenarios,
        ).toBe(
          1,
        );


        expect(
          diff.changes[
            0
          ].materiality,
        ).toBe(
          "MEDIUM",
        );
      },
    );


    it(
      "categorizes monthly overrides as high materiality",
      () => {
        const diff =
          compareRevisionSnapshots(
            revision(
              1,
              {
                monthlyOverrides:
                  [],
              },
            ),
            revision(
              2,
              {
                monthlyOverrides: [
                  {
                    id:
                      "o1",

                    period:
                      "2027-03",

                    value:
                      500,
                  },
                ],
              },
            ),
          );


        expect(
          diff.summary
            .overrides,
        ).toBe(
          1,
        );


        expect(
          diff.changes[
            0
          ].materiality,
        ).toBe(
          "HIGH",
        );
      },
    );


    it(
      "treats structural currency changes as high materiality",
      () => {
        const diff =
          compareRevisionSnapshots(
            revision(
              1,
              {
                currency:
                  "EUR",
              },
            ),
            revision(
              2,
              {
                currency:
                  "USD",
              },
            ),
          );


        expect(
          diff.changes[
            0
          ].category,
        ).toBe(
          "PROJECT",
        );


        expect(
          diff.changes[
            0
          ].materiality,
        ).toBe(
          "HIGH",
        );
      },
    );
  },
);
