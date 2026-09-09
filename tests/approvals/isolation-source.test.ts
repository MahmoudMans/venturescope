import {
  readFileSync,
} from "node:fs";

import {
  describe,
  expect,
  it,
} from "vitest";


const service =
  readFileSync(
    "lib/approvals/service.ts",
    "utf8",
  );


describe(
  "Approval Workflow domain isolation",
  () => {
    it(
      "does not mutate projects or forecasts",
      () => {
        expect(
          service,
        ).not.toContain(
          "project.update",
        );


        expect(
          service,
        ).not.toContain(
          "forecast",
        );
      },
    );


    it(
      "does not mutate Actuals",
      () => {
        expect(
          service,
        ).not.toContain(
          "actualPeriod.update",
        );


        expect(
          service,
        ).not.toContain(
          "actualPeriod.delete",
        );
      },
    );


    it(
      "does not mutate financial close",
      () => {
        expect(
          service,
        ).not.toContain(
          "financialPeriodState.update",
        );
      },
    );


    it(
      "does not mutate risk policy KPI targets or decision actions",
      () => {
        expect(
          service,
        ).not.toContain(
          "projectRiskPolicy.update",
        );


        expect(
          service,
        ).not.toContain(
          "projectKpiTarget.update",
        );


        expect(
          service,
        ).not.toContain(
          "decisionAction.update",
        );
      },
    );
  },
);
