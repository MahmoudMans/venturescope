import {
  describe,
  expect,
  it,
} from "vitest";

import {
  compareRevisionSnapshots,
} from "@/lib/projects/version-diff/diff";

import {
  normalizeJsonValue,
} from "@/lib/projects/version-diff/json";

import type {
  RevisionDiffView,
} from "@/lib/projects/version-diff/types";


describe(
  "version diff immutability",
  () => {
    it(
      "does not mutate either revision snapshot",
      () => {
        const beforeSnapshot =
          normalizeJsonValue({
            baseAssumptions: {
              growth:
                0.10,
            },

            scenarios: [
              {
                id:
                  "base",

                name:
                  "Base",
              },
            ],
          });


        const afterSnapshot =
          normalizeJsonValue({
            baseAssumptions: {
              growth:
                0.15,
            },

            scenarios: [
              {
                id:
                  "base",

                name:
                  "Base",
              },
            ],
          });


        const beforeSerialized =
          JSON.stringify(
            beforeSnapshot,
          );


        const afterSerialized =
          JSON.stringify(
            afterSnapshot,
          );


        const from:
          RevisionDiffView = {
            id:
              "1",

            version:
              1,

            label:
              null,

            reason:
              null,

            sourceRevisionId:
              null,

            createdAt:
              "2027-01-01T00:00:00.000Z",

            snapshot:
              beforeSnapshot,
          };


        const to:
          RevisionDiffView = {
            ...from,

            id:
              "2",

            version:
              2,

            snapshot:
              afterSnapshot,
          };


        compareRevisionSnapshots(
          from,
          to,
        );


        expect(
          JSON.stringify(
            beforeSnapshot,
          ),
        ).toBe(
          beforeSerialized,
        );


        expect(
          JSON.stringify(
            afterSnapshot,
          ),
        ).toBe(
          afterSerialized,
        );
      },
    );


    it(
      "normalizes nested valid JSON values",
      () => {
        expect(
          normalizeJsonValue({
            a:
              1,

            b: [
              true,
              null,
              "x",
            ],
          }),
        ).toEqual({
          a:
            1,

          b: [
            true,
            null,
            "x",
          ],
        });
      },
    );


    it(
      "rejects unsupported undefined values",
      () => {
        expect(
          () =>
            normalizeJsonValue({
              broken:
                undefined,
            }),
        ).toThrow(
          /unsupported JSON/i,
        );
      },
    );
  },
);
