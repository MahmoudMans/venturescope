import {
  readFileSync,
} from "node:fs";

import {
  describe,
  expect,
  it,
} from "vitest";


const schema =
  readFileSync(
    "prisma/schema.prisma",
    "utf8",
  );


describe(
  "VarianceCommentary schema",
  () => {
    it(
      "persists structured variance explanation fields",
      () => {
        expect(
          schema,
        ).toContain(
          "model VarianceCommentary",
        );


        expect(
          schema,
        ).toMatch(
          /causeCode\s+String/,
        );


        expect(
          schema,
        ).toMatch(
          /varianceNature\s+String/,
        );


        expect(
          schema,
        ).toMatch(
          /explanation\s+String/,
        );
      },
    );


    it(
      "persists corrective-action governance",
      () => {
        expect(
          schema,
        ).toMatch(
          /correctiveAction\s+String\?/,
        );


        expect(
          schema,
        ).toMatch(
          /ownerName\s+String\?/,
        );


        expect(
          schema,
        ).toMatch(
          /recoveryPeriodKey\s+String\?/,
        );


        expect(
          schema,
        ).toMatch(
          /status\s+String/,
        );
      },
    );


    it(
      "enforces one commentary per project period and metric",
      () => {
        expect(
          schema,
        ).toContain(
          "@@unique([projectId, periodKey, metricCode])",
        );
      },
    );
  },
);
