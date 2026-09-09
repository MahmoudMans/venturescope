import {
  readFileSync,
} from "node:fs";

import {
  describe,
  expect,
  it,
} from "vitest";


const calculations =
  readFileSync(
    "lib/finance/sensitivity-lab/calculations.ts",
    "utf8",
  );


const component =
  readFileSync(
    "components/sensitivity-lab/sensitivity-lab-workspace.tsx",
    "utf8",
  );


const schema =
  readFileSync(
    "prisma/schema.prisma",
    "utf8",
  );


describe(
  "Sensitivity Lab financial authorities",
  () => {
    it(
      "reuses Risk Center downside calculation",
      () => {
        expect(
          calculations,
        ).toContain(
          "buildDownsideCashScenario",
        );
      },
    );


    it(
      "reuses Capital Planning funding-gap calculation",
      () => {
        expect(
          calculations,
        ).toContain(
          "calculateCapitalPlanningReport",
        );
      },
    );


    it(
      "keeps financial formulas outside UI",
      () => {
        expect(
          component,
        ).not.toContain(
          "revenueLoss",
        );


        expect(
          component,
        ).not.toContain(
          "extraCosts",
        );


        expect(
          component,
        ).not.toContain(
          "requiredCapitalAfterRaise -",
        );
      },
    );


    it(
      "does not create duplicate sensitivity persistence",
      () => {
        expect(
          schema,
        ).not.toContain(
          "model SensitivitySurface",
        );


        expect(
          schema,
        ).not.toContain(
          "model SensitivityCase",
        );
      },
    );
  },
);
