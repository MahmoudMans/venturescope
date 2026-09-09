import {
  readFileSync,
} from "node:fs";

import {
  describe,
  expect,
  it,
} from "vitest";


const source =
  readFileSync(
    "lib/projects/project-access.ts",
    "utf8",
  );


describe(
  "collaborative project projection",
  () => {
    it(
      "keeps the original rich Prisma project query",
      () => {
        expect(
          source,
        ).toContain(
          "scenarios:",
        );


        expect(
          source,
        ).toContain(
          "_count:",
        );


        expect(
          source,
        ).toContain(
          "financingEvents:",
        );


        expect(
          source,
        ).toContain(
          "monthlyOverrides:",
        );
      },
    );


    it(
      "does not require workspaceId on the rich project result",
      () => {
        expect(
          source,
        ).not.toContain(
          "project.workspaceId",
        );
      },
    );


    it(
      "uses a separate minimal workspaceId authorization query",
      () => {
        expect(
          source,
        ).toContain(
          "workspacePermissionForAccessibleProject",
        );


        expect(
          source,
        ).toContain(
          "workspaceId:",
        );


        expect(
          source,
        ).toContain(
          "getWorkspacePermission",
        );
      },
    );


    it(
      "derives Editor and Owner authorization from the same rich project type",
      () => {
        expect(
          source,
        ).toContain(
          "ReturnType<",
        );


        expect(
          source,
        ).toContain(
          "typeof getOwnedProject",
        );


        expect(
          source,
        ).toContain(
          "getProjectForEditor",
        );


        expect(
          source,
        ).toContain(
          "getProjectForOwner",
        );
      },
    );
  },
);
