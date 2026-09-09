import {
  readFileSync,
} from "node:fs";

import {
  describe,
  expect,
  it,
} from "vitest";


const component =
  readFileSync(
    "components/portfolio-dashboard/portfolio-dashboard-workspace.tsx",
    "utf8",
  );


const calculations =
  readFileSync(
    "lib/finance/portfolio-dashboard/calculations.ts",
    "utf8",
  );


describe(
  "Portfolio Dashboard authority reuse",
  () => {
    it(
      "reuses authenticated project forecast exports",
      () => {
        expect(
          component,
        ).toContain(
          "/export/csv",
        );
      },
    );


    it(
      "reuses Board Room executive snapshot authority",
      () => {
        expect(
          component,
        ).toContain(
          "buildExecutiveReviewSnapshot",
        );
      },
    );


    it(
      "reuses Management Scorecard authority",
      () => {
        expect(
          component,
        ).toContain(
          "calculateManagementScorecard",
        );
      },
    );


    it(
      "contains no FX conversion authority",
      () => {
        expect(
          calculations.toLowerCase(),
        ).not.toContain(
          "exchange rate",
        );


        expect(
          calculations.toLowerCase(),
        ).not.toContain(
          "fxrate",
        );
      },
    );
  },
);
