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
    "app/(app)/projects/[projectId]/decision-center/actions.ts",
    "utf8",
  );


const service =
  readFileSync(
    "lib/finance/decision-center/service.ts",
    "utf8",
  );


const page =
  readFileSync(
    "app/(app)/projects/[projectId]/decision-center/page.tsx",
    "utf8",
  );


const component =
  readFileSync(
    "components/decision-center/decision-center-workspace.tsx",
    "utf8",
  );


describe(
  "Decision Center security architecture",
  () => {
    it(
      "requires Editor permission for both write operations",
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
      "scopes action status changes to project ID",
      () => {
        expect(
          service,
        ).toContain(
          "decisionAction.updateMany",
        );


        expect(
          service,
        ).toMatch(
          /id:\s*actionId,[\s\S]*projectId/,
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
      "aggregates established finance authorities",
      () => {
        expect(
          component,
        ).toContain(
          "calculateVarianceReport",
        );


        expect(
          component,
        ).toContain(
          "calculateForecastAccuracyReport",
        );


        expect(
          component,
        ).toContain(
          "calculateLiquidityRiskReport",
        );


        expect(
          component,
        ).toContain(
          "calculateCapitalPlanningReport",
        );
      },
    );
  },
);
