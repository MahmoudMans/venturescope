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
    "app/(app)/projects/[projectId]/board-pack/page.tsx",
    "utf8",
  );


const component =
  readFileSync(
    "components/board-pack/board-pack-workspace.tsx",
    "utf8",
  );


const schema =
  readFileSync(
    "prisma/schema.prisma",
    "utf8",
  );


describe(
  "Board Pack architecture",
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
      "creates no Board Pack mutation Server Action",
      () => {
        expect(
          existsSync(
            "app/(app)/projects/[projectId]/board-pack/actions.ts",
          ),
        ).toBe(
          false,
        );
      },
    );


    it(
      "scopes persistent project data by project ID",
      () => {
        expect(
          page,
        ).toContain(
          "projectId",
        );


        expect(
          page,
        ).toContain(
          "projectAuditEvent.count",
        );


        expect(
          page,
        ).toContain(
          "decisionAction.findMany",
        );
      },
    );


    it(
      "creates no duplicate Board Pack persistence",
      () => {
        expect(
          schema,
        ).not.toContain(
          "model BoardPack",
        );


        expect(
          schema,
        ).not.toContain(
          "model ManagementPack",
        );
      },
    );


    it(
      "contains no mutation action imports",
      () => {
        expect(
          component,
        ).not.toContain(
          '/actions"',
        );
      },
    );
  },
);
