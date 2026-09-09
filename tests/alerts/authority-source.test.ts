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
    "components/alerts/alert-inbox-workspace.tsx",
    "utf8",
  );


const calculations =
  readFileSync(
    "lib/notifications/calculations.ts",
    "utf8",
  );


describe(
  "Alert Inbox authority reuse",
  () => {
    it(
      "uses authenticated forecast export",
      () => {
        expect(
          component,
        ).toContain(
          "/export/csv",
        );
      },
    );


    it(
      "reuses Board Room snapshot authority",
      () => {
        expect(
          component,
        ).toContain(
          "buildExecutiveReviewSnapshot",
        );
      },
    );


    it(
      "reuses Scorecard authority",
      () => {
        expect(
          component,
        ).toContain(
          "calculateManagementScorecard",
        );
      },
    );


    it(
      "reuses Variance Review authority",
      () => {
        expect(
          component,
        ).toContain(
          "calculateVarianceReview",
        );
      },
    );


    it(
      "reuses Financial Close authority",
      () => {
        expect(
          component,
        ).toContain(
          "buildFinancialPeriodRegister",
        );
      },
    );


    it(
      "derives alert source links instead of mutation paths",
      () => {
        expect(
          calculations,
        ).toContain(
          "/risk-center",
        );


        expect(
          calculations,
        ).toContain(
          "/capital-planning",
        );


        expect(
          calculations,
        ).toContain(
          "/decision-center",
        );


        expect(
          calculations,
        ).toContain(
          "/activity",
        );
      },
    );
  },
);
