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
  "ActualPeriod schema",
  () => {
    it(
      "enforces one monthly actual record per project",
      () => {
        expect(
          schema,
        ).toContain(
          "@@unique([projectId, period])",
        );
      },
    );


    it(
      "uses Decimal financial values",
      () => {
        expect(
          schema,
        ).toMatch(
          /revenue\s+Decimal\?/,
        );


        expect(
          schema,
        ).toMatch(
          /cashBalance\s+Decimal\?/,
        );
      },
    );


    it(
      "cascades with project deletion",
      () => {
        expect(
          schema,
        ).toContain(
          "onDelete: Cascade",
        );
      },
    );
  },
);
