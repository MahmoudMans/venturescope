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
    "app/(app)/workspaces/actions.ts",
    "utf8",
  );


describe(
  "workspace Viewer write boundary",
  () => {
    it(
      "requires Editor permission to share a project",
      () => {
        const start =
          actions.indexOf(
            "assignProjectToWorkspaceAction",
          );


        const end =
          actions.indexOf(
            "removeProjectFromWorkspaceAction",
          );


        expect(
          start,
        ).toBeGreaterThanOrEqual(
          0,
        );


        expect(
          end,
        ).toBeGreaterThan(
          start,
        );


        const assignment =
          actions.slice(
            start,
            end,
          );


        expect(
          assignment,
        ).toContain(
          '"EDITOR"',
        );


        expect(
          assignment,
        ).not.toContain(
          '"VIEWER"',
        );
      },
    );


    it(
      "keeps Viewer below Editor permission",
      async () => {
        const {
          hasWorkspacePermission,
        } =
          await import(
            "@/lib/workspaces/permissions"
          );


        expect(
          hasWorkspacePermission(
            "VIEWER",
            "EDITOR",
          ),
        ).toBe(
          false,
        );
      },
    );
  },
);
