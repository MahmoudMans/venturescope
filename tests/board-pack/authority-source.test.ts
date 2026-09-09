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
    "components/board-pack/board-pack-workspace.tsx",
    "utf8",
  );


describe(
  "Board Pack authority reuse",
  () => {
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
      "reuses Financial Close register authority",
      () => {
        expect(
          component,
        ).toContain(
          "buildFinancialPeriodRegister",
        );
      },
    );


    it(
      "reuses frozen-vs-live Board Room comparison",
      () => {
        expect(
          component,
        ).toContain(
          "compareExecutiveReview",
        );
      },
    );


    it(
      "uses authoritative forecast CSV",
      () => {
        expect(
          component,
        ).toContain(
          "/export/csv",
        );
      },
    );
  },
);
