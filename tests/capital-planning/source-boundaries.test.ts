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
    "app/(app)/projects/[projectId]/capital-planning/page.tsx",
    "utf8",
  );


const component =
  readFileSync(
    "components/capital-planning/capital-planning-workspace.tsx",
    "utf8",
  );


const calculations =
  readFileSync(
    "lib/finance/capital-planning/calculations.ts",
    "utf8",
  );


const schema =
  readFileSync(
    "prisma/schema.prisma",
    "utf8",
  );


describe(
  "Capital Planning architecture",
  () => {
    it(
      "uses existing collaborative project access",
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
      "uses persisted Risk Center policy",
      () => {
        expect(
          page,
        ).toContain(
          "projectRiskPolicy.findUnique",
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
      "reuses Risk Center downside calculations",
      () => {
        expect(
          calculations,
        ).toContain(
          "buildDownsideCashScenario",
        );
      },
    );


    it(
      "keeps financing formulas outside UI",
      () => {
        expect(
          calculations,
        ).toContain(
          "amortizedMonthlyPayment",
        );


        expect(
          component,
        ).not.toContain(
          "monthlyRate",
        );
      },
    );


    it(
      "does not add a duplicate persisted capital-plan model",
      () => {
        expect(
          schema,
        ).not.toContain(
          "model CapitalPlan",
        );


        expect(
          schema,
        ).not.toContain(
          "model FundingStrategy",
        );
      },
    );
  },
);
