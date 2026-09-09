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
    "app/(app)/projects/[projectId]/forecast-accuracy/page.tsx",
    "utf8",
  );


const component =
  readFileSync(
    "components/forecast-accuracy/forecast-accuracy-workspace.tsx",
    "utf8",
  );


const calculations =
  readFileSync(
    "lib/finance/forecast-accuracy/calculations.ts",
    "utf8",
  );


const navigation =
  readFileSync(
    "lib/projects/workspace-navigation.ts",
    "utf8",
  );


describe(
  "forecast accuracy architecture",
  () => {
    it(
      "uses existing collaborative project read authority",
      () => {
        expect(
          page,
        ).toContain(
          "getOwnedProject",
        );
      },
    );


    it(
      "uses persisted ActualPeriod observations",
      () => {
        expect(
          page,
        ).toContain(
          "actualPeriod.findMany",
        );
      },
    );


    it(
      "uses authoritative forecast CSV instead of creating a second forecast",
      () => {
        expect(
          component,
        ).toContain(
          "/export/csv",
        );


        expect(
          component,
        ).not.toContain(
          "calculateRevenue",
        );
      },
    );


    it(
      "keeps accuracy formulas outside UI",
      () => {
        expect(
          calculations,
        ).toContain(
          "calculateAccuracyStatistics",
        );


        expect(
          component,
        ).not.toContain(
          "Math.sqrt",
        );
      },
    );


    it(
      "exposes Forecast Accuracy in workspace navigation",
      () => {
        expect(
          navigation,
        ).toContain(
          "Forecast Accuracy",
        );


        expect(
          navigation,
        ).toContain(
          "/forecast-accuracy",
        );
      },
    );
  },
);
