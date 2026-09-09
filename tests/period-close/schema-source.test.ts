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
  "Financial Close schema",
  () => {
    it(
      "persists one state per project and financial period",
      () => {
        expect(
          schema,
        ).toContain(
          "model FinancialPeriodState",
        );


        expect(
          schema,
        ).toContain(
          "@@unique([projectId, period])",
        );
      },
    );


    it(
      "persists close lifecycle metadata",
      () => {
        expect(
          schema,
        ).toMatch(
          /status\s+String/,
        );


        expect(
          schema,
        ).toMatch(
          /closeSequence\s+Int/,
        );


        expect(
          schema,
        ).toMatch(
          /closedByUserId\s+String\?/,
        );


        expect(
          schema,
        ).toMatch(
          /reopenedByUserId\s+String\?/,
        );
      },
    );


    it(
      "persists append-only financial-close events",
      () => {
        expect(
          schema,
        ).toContain(
          "model FinancialPeriodEvent",
        );


        expect(
          schema,
        ).toMatch(
          /action\s+String/,
        );


        expect(
          schema,
        ).toMatch(
          /actorUserId\s+String/,
        );


        expect(
          schema,
        ).toMatch(
          /sequence\s+Int/,
        );
      },
    );
  },
);
