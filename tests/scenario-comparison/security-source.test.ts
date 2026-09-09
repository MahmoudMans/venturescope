import {
  existsSync,
  readFileSync,
} from "node:fs";

import {
  describe,
  expect,
  it,
} from "vitest";


const page =
  readFileSync(
    "app/(app)/projects/[projectId]/scenario-comparison/page.tsx",
    "utf8",
  );


const component =
  readFileSync(
    "components/scenario-comparison/scenario-comparison-workspace.tsx",
    "utf8",
  );


const comparison =
  readFileSync(
    "lib/projects/scenario-comparison/comparison.ts",
    "utf8",
  );


const schema =
  readFileSync(
    "prisma/schema.prisma",
    "utf8",
  );


describe(
  "Scenario Comparison architecture",
  () => {
    it(
      "uses collaborative project read authority",
      () => {
        expect(
          page,
        ).toContain(
          "getOwnedProject",
        );
      },
    );


    it(
      "does not require Editor authority",
      () => {
        expect(
          page,
        ).not.toContain(
          "requireProjectEditor",
        );


        expect(
          page,
        ).not.toContain(
          "getProjectForEditor",
        );
      },
    );


    it(
      "creates no Scenario Comparison mutation action",
      () => {
        expect(
          existsSync(
            "app/(app)/projects/[projectId]/scenario-comparison/actions.ts",
          ),
        ).toBe(
          false,
        );
      },
    );


    it(
      "reuses Step 31 recursive diff authority",
      () => {
        expect(
          comparison,
        ).toContain(
          "compareRevisionSnapshots",
        );
      },
    );


    it(
      "keeps existing Scenarios workspace as mutation authority",
      () => {
        expect(
          component,
        ).toContain(
          "/scenarios",
        );
      },
    );


    it(
      "does not create duplicate scenario persistence",
      () => {
        expect(
          schema,
        ).not.toContain(
          "model ScenarioComparison",
        );


        expect(
          schema,
        ).not.toContain(
          "model ScenarioDecisionMatrix",
        );
      },
    );
  },
);
