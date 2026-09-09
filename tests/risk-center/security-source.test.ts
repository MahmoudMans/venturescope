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
    "app/(app)/projects/[projectId]/risk-center/actions.ts",
    "utf8",
  );


const page =
  readFileSync(
    "app/(app)/projects/[projectId]/risk-center/page.tsx",
    "utf8",
  );


const component =
  readFileSync(
    "components/risk-center/risk-center-workspace.tsx",
    "utf8",
  );


const calculations =
  readFileSync(
    "lib/finance/risk-center/calculations.ts",
    "utf8",
  );


const versioning =
  readFileSync(
    "lib/projects/versioning/service.ts",
    "utf8",
  );


describe(
  "Risk Center security architecture",
  () => {
    it(
      "requires Editor permission for guardrail mutation",
      () => {
        expect(
          actions.match(
            /\brequireProjectEditor\s*\(/g,
          ) ??
          [],
        ).toHaveLength(
          1,
        );
      },
    );


    it(
      "permits project readers to view risk analysis",
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
      "keeps formulas outside UI",
      () => {
        expect(
          calculations,
        ).toContain(
          "calculateLiquidityRiskReport",
        );


        expect(
          component,
        ).not.toContain(
          "revenueLoss",
        );
      },
    );


    it(
      "does not add governance policies to immutable model restore state",
      () => {
        expect(
          versioning,
        ).not.toContain(
          "riskPolicy:",
        );
      },
    );
  },
);
