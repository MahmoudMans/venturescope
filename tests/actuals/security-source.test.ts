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
    "app/(app)/projects/[projectId]/actuals/actions.ts",
    "utf8",
  );


const page =
  readFileSync(
    "app/(app)/projects/[projectId]/actuals/page.tsx",
    "utf8",
  );


const component =
  readFileSync(
    "components/actuals/actuals-variance-workspace.tsx",
    "utf8",
  );


const versioning =
  readFileSync(
    "lib/projects/versioning/service.ts",
    "utf8",
  );


describe(
  "Actuals security architecture",
  () => {
    it(
      "requires Editor permission for both mutations",
      () => {
        const calls =
          actions.match(
            /\brequireProjectEditor\s*\(/g,
          ) ??
          [];


        expect(
          calls,
        ).toHaveLength(
          2,
        );
      },
    );


    it(
      "permits project readers to view Actuals",
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
      "uses the authoritative forecast export instead of reimplementing forecast math",
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
      "keeps actual observations outside immutable planning revisions",
      () => {
        expect(
          versioning,
        ).not.toContain(
          "actualPeriods:",
        );
      },
    );
  },
);
