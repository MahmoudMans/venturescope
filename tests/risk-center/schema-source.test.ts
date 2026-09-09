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
  "ProjectRiskPolicy schema",
  () => {
    it(
      "enforces one risk policy per project",
      () => {
        expect(
          schema,
        ).toMatch(
          /projectId\s+String\s+@unique/,
        );
      },
    );


    it(
      "uses Decimal financial guardrails",
      () => {
        expect(
          schema,
        ).toMatch(
          /minimumCash\s+Decimal\?/,
        );


        expect(
          schema,
        ).toMatch(
          /maximumMonthlyBurn\s+Decimal\?/,
        );
      },
    );


    it(
      "persists downside stress assumptions",
      () => {
        expect(
          schema,
        ).toContain(
          "downsideRevenueShock",
        );


        expect(
          schema,
        ).toContain(
          "downsideCostInflation",
        );
      },
    );
  },
);
