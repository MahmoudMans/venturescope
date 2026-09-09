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
    "app/(app)/projects/[projectId]/templates/page.tsx",
    "utf8",
  );


const component =
  readFileSync(
    "components/planning-templates/planning-templates-workspace.tsx",
    "utf8",
  );


const schema =
  readFileSync(
    "prisma/schema.prisma",
    "utf8",
  );


describe(
  "Planning Templates architecture",
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
      "creates no mutation Server Action",
      () => {
        expect(
          existsSync(
            "app/(app)/projects/[projectId]/templates/actions.ts",
          ),
        ).toBe(
          false,
        );
      },
    );


    it(
      "contains no project mutation calls",
      () => {
        expect(
          component,
        ).not.toContain(
          "project.update",
        );


        expect(
          component,
        ).not.toContain(
          "fetch(",
        );
      },
    );


    it(
      "creates no duplicate persistence model",
      () => {
        expect(
          schema,
        ).not.toContain(
          "model PlanningTemplate",
        );


        expect(
          schema,
        ).not.toContain(
          "model IndustryTemplate",
        );
      },
    );
  },
);
