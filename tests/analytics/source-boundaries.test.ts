import {
  readFileSync,
} from "node:fs";

import {
  describe,
  expect,
  it,
} from "vitest";


const page =
  readFileSync(
    "app/(app)/projects/[projectId]/analytics/page.tsx",
    "utf8",
  );


const component =
  readFileSync(
    "components/analytics/advanced-financial-analytics.tsx",
    "utf8",
  );


const calculations =
  readFileSync(
    "lib/finance/analytics/calculations.ts",
    "utf8",
  );


const navigation =
  readFileSync(
    "lib/projects/workspace-navigation.ts",
    "utf8",
  );


describe(
  "advanced analytics architecture",
  () => {
    it(
      "uses established project authorization",
      () => {
        expect(
          page,
        ).toContain(
          "getOwnedProject",
        );
      },
    );


    it(
      "uses the existing authenticated forecast CSV authority",
      () => {
        expect(
          component,
        ).toContain(
          "/export/csv",
        );
      },
    );


    it(
      "keeps finance formulas out of the route page",
      () => {
        expect(
          page,
        ).not.toContain(
          "terminalGrowthRate",
        );


        expect(
          calculations,
        ).toContain(
          "calculateDcf",
        );
      },
    );


    it(
      "adds Analytics to project workspace navigation",
      () => {
        expect(
          navigation,
        ).toContain(
          "Analytics",
        );


        expect(
          navigation,
        ).toContain(
          "/analytics",
        );
      },
    );
  },
);
