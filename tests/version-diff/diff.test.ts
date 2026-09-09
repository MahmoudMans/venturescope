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
      `revision-${version}`,

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
  "model version diff",
  () => {
    it(
      "detects assumption changes as high materiality",
      () => {
        const result =
          compareRevisionSnapshots(
            revision(
              1,
              {
                baseAssumptions: {
                  revenueGrowth:
                    0.10,
                },
              },
            ),
            revision(
              2,
              {
                baseAssumptions: {
                  revenueGrowth:
                    0.15,
                },
              },
            ),
          );


        expect(
          result.changes,
        ).toHaveLength(
          1,
        );


        expect(
          result.changes[
            0
          ].category,
        ).toBe(
          "ASSUMPTIONS",
        );


        expect(
          result.changes[
            0
          ].materiality,
        ).toBe(
          "HIGH",
        );


        expect(
          result.changes[
            0
          ].path,
        ).toBe(
          "$.baseAssumptions.revenueGrowth",
        );
      },
    );


    it(
      "detects additions and removals",
      () => {
        const result =
          compareRevisionSnapshots(
            revision(
              1,
              {
                financingEvents: [
                  {
                    id:
                      "f1",

                    amount:
                      100,
                  },
                ],
              },
            ),
            revision(
              2,
              {
                financingEvents: [
                  {
                    id:
                      "f2",

                    amount:
                      200,
                  },
                ],
              },
            ),
          );


        expect(
          result.summary
            .added,
        ).toBe(
          1,
        );


        expect(
          result.summary
            .removed,
        ).toBe(
          1,
        );


        expect(
          result.summary
            .financing,
        ).toBe(
          2,
        );
      },
    );


    it(
      "does not treat stable identity-array reordering as a model change",
      () => {
        const before = {
          scenarios: [
            {
              id:
                "a",

              name:
                "Base",
            },

            {
              id:
                "b",

              name:
                "Bull",
            },
          ],
        };


        const after = {
          scenarios: [
            {
              id:
                "b",

              name:
                "Bull",
            },

            {
              id:
                "a",

              name:
                "Base",
            },
          ],
        };


        const result =
          compareRevisionSnapshots(
            revision(
              1,
              before,
            ),
            revision(
              2,
              after,
            ),
          );


        expect(
          result.summary
            .total,
        ).toBe(
          0,
        );
      },
    );


    it(
      "detects type changes explicitly",
      () => {
        const result =
          compareRevisionSnapshots(
            revision(
              1,
              {
                baseAssumptions: {
                  customers:
                    100,
                },
              },
            ),
            revision(
              2,
              {
                baseAssumptions: {
                  customers:
                    "100",
                },
              },
            ),
          );


        expect(
          result.changes[
            0
          ].kind,
        ).toBe(
          "TYPE_CHANGED",
        );


        expect(
          result.changes[
            0
          ].materiality,
        ).toBe(
          "HIGH",
        );
      },
    );
  },
);
