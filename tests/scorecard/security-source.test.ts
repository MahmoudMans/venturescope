import {
  readFileSync,
} from "node:fs";

import {
  describe,
  expect,
  it,
} from "vitest";


const actions =
  readFileSync(
    "app/(app)/projects/[projectId]/scorecard/actions.ts",
    "utf8",
  );


const service =
  readFileSync(
    "lib/finance/scorecard/service.ts",
    "utf8",
  );


const page =
  readFileSync(
    "app/(app)/projects/[projectId]/scorecard/page.tsx",
    "utf8",
  );


const component =
  readFileSync(
    "components/scorecard/scorecard-workspace.tsx",
    "utf8",
  );


const calculations =
  readFileSync(
    "lib/finance/scorecard/calculations.ts",
    "utf8",
  );


describe(
  "Scorecard security architecture",
  () => {
    it(
      "requires Editor permission for both target mutations",
      () => {
        expect(
          actions.match(
            /\brequireProjectEditor\s*\(/g,
          ) ??
          [],
        ).toHaveLength(
          2,
        );
      },
    );


    it(
      "scopes deletion to target and project",
      () => {
        expect(
          service,
        ).toContain(
          "projectKpiTarget.deleteMany",
        );


        expect(
          service,
        ).toMatch(
          /id:\s*targetId,[\s\S]*projectId/,
        );
      },
    );


    it(
      "uses collaborative read authority",
      () => {
        expect(
          page,
        ).toContain(
          "getOwnedProject",
        );


        expect(
          page,
        ).toContain(
          "getProjectForEditor",
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


    it(
      "reuses Forecast Accuracy and Risk Center calculations",
      () => {
        expect(
          calculations,
        ).toContain(
          "calculateForecastAccuracyReport",
        );


        expect(
          calculations,
        ).toContain(
          "calculateLiquidityRiskReport",
        );
      },
    );


    it(
      "does not mutate forecast from scorecard",
      () => {
        expect(
          actions,
        ).not.toContain(
          "forecast",
        );


        expect(
          service,
        ).not.toContain(
          "project.update",
        );
      },
    );
  },
);
