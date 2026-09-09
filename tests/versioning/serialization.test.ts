import {
  describe,
  expect,
  it,
} from "vitest";

import {
  parseProjectRevisionSnapshot,
  prepareRelationRows,
} from "@/lib/projects/versioning/serialization";


const snapshot = {
  schemaVersion:
    1,

  capturedAt:
    "2026-09-09T08:00:00.000Z",

  project: {
    name:
      "Orbit Analytics",

    industry:
      "SaaS",

    currency:
      "EUR",

    startMonth:
      "2026-01-01T00:00:00.000Z",

    horizonMonths:
      36,

    revenueMode:
      "DIRECT",

    baseAssumptions: {
      example:
        true,
    },
  },

  scenarios: [],

  financingEvents: [],

  monthlyOverrides: [],
};


describe(
  "project revision snapshots",
  () => {
    it(
      "parses the supported immutable snapshot schema",
      () => {
        const parsed =
          parseProjectRevisionSnapshot(
            snapshot,
          );


        expect(
          parsed.schemaVersion,
        ).toBe(
          1,
        );


        expect(
          parsed.project.name,
        ).toBe(
          "Orbit Analytics",
        );
      },
    );


    it(
      "rejects unsupported future schemas",
      () => {
        expect(
          () =>
            parseProjectRevisionSnapshot({
              ...snapshot,

              schemaVersion:
                999,
            }),
        ).toThrow(
          /Unsupported/,
        );
      },
    );


    it(
      "preserves relation IDs while replacing project ownership",
      () => {
        expect(
          prepareRelationRows(
            [
              {
                id:
                  "override-1",

                projectId:
                  "old-project",

                scenarioId:
                  "scenario-1",

                createdAt:
                  "old",

                updatedAt:
                  "old",

                value:
                  42,
              },
            ],
            "new-project",
          )[
            0
          ],
        ).toEqual({
          id:
            "override-1",

          scenarioId:
            "scenario-1",

          value:
            42,

          projectId:
            "new-project",
        });
      },
    );
  },
);
