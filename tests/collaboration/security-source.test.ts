import {
  readFileSync,
} from "node:fs";

import {
  describe,
  expect,
  it,
} from "vitest";


const access =
  readFileSync(
    "lib/workspaces/project-access.ts",
    "utf8",
  );


const actions =
  readFileSync(
    "app/(app)/workspaces/actions.ts",
    "utf8",
  );


describe(
  "collaboration authorization source",
  () => {
    it(
      "has distinct viewer, editor and owner project boundaries",
      () => {
        expect(
          access,
        ).toContain(
          "getProjectForViewer",
        );

        expect(
          access,
        ).toContain(
          "getProjectForEditor",
        );

        expect(
          access,
        ).toContain(
          "requireProjectOwner",
        );
      },
    );


    it(
      "requires workspace owner permission for member governance",
      () => {
        expect(
          actions,
        ).toContain(
          '"OWNER"',
        );

        expect(
          actions,
        ).toContain(
          "updateWorkspaceMemberRoleAction",
        );

        expect(
          actions,
        ).toContain(
          "removeWorkspaceMemberAction",
        );
      },
    );


    it(
      "only lets personal owners assign their project",
      () => {
        expect(
          actions,
        ).toContain(
          `userId:
          user.id`,
        );
      },
    );


    it(
      "requires Editor permission to share a project into a workspace",
      () => {
        const assignmentStart =
          actions.indexOf(
            "assignProjectToWorkspaceAction",
          );

        const assignmentEnd =
          actions.indexOf(
            "removeProjectFromWorkspaceAction",
          );


        expect(
          assignmentStart,
        ).toBeGreaterThanOrEqual(
          0,
        );

        expect(
          assignmentEnd,
        ).toBeGreaterThan(
          assignmentStart,
        );


        const assignment =
          actions.slice(
            assignmentStart,
            assignmentEnd,
          );


        expect(
          assignment,
        ).toContain(
          `"EDITOR"`,
        );

        expect(
          assignment,
        ).not.toContain(
          `"VIEWER"`,
        );
      },
    );
  },
);
