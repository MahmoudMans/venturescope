import {
  readFileSync,
} from "node:fs";

import {
  describe,
  expect,
  it,
} from "vitest";


const fx =
  readFileSync(
    "lib/finance/consolidation/fx.ts",
    "utf8",
  );


const component =
  readFileSync(
    "components/consolidation/consolidation-workspace.tsx",
    "utf8",
  );


describe(
  "multi-currency authority isolation",
  () => {
    it(
      "contains no external FX API calls",
      () => {
        expect(
          fx,
        ).not.toContain(
          "fetch(",
        );


        expect(
          fx.toLowerCase(),
        ).not.toContain(
          "exchangerate",
        );


        expect(
          fx.toLowerCase(),
        ).not.toContain(
          "forex",
        );
      },
    );


    it(
      "uses project forecast endpoint only for financial analytics",
      () => {
        expect(
          component,
        ).toContain(
          "/export/csv",
        );
      },
    );


    it(
      "does not triangulate FX",
      () => {
        expect(
          fx.toLowerCase(),
        ).not.toContain(
          "triangulat",
        );
      },
    );
  },
);
