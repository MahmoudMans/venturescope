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
    "app/(app)/projects/[projectId]/variance-review/actions.ts",
    "utf8",
  );


const service =
  readFileSync(
    "lib/finance/variance-review/service.ts",
    "utf8",
  );


const page =
  readFileSync(
    "app/(app)/projects/[projectId]/variance-review/page.tsx",
    "utf8",
  );


const component =
  readFileSync(
    "components/variance-review/variance-review-workspace.tsx",
    "utf8",
  );


describe(
  "Variance Review security",
  () => {
    it(
      "requires Editor permission for both commentary mutations",
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
      "scopes commentary deletion to project",
      () => {
        expect(
          service,
        ).toContain(
          "varianceCommentary.findFirst",
        );


        expect(
          service,
        ).toMatch(
          /id:\s*commentaryId,[\s\S]*projectId/,
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
      "uses authoritative forecast export",
      () => {
        expect(
          component,
        ).toContain(
          "/export/csv",
        );
      },
    );


    it(
      "does not mutate Actuals or forecast",
      () => {
        expect(
          service,
        ).not.toContain(
          "actualPeriod.update",
        );


        expect(
          service,
        ).not.toContain(
          "project.update",
        );


        expect(
          actions,
        ).not.toContain(
          "actualPeriod",
        );
      },
    );
  },
);
