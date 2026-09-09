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
    "app/(app)/projects/[projectId]/consolidation/actions.ts",
    "utf8",
  );


const page =
  readFileSync(
    "app/(app)/projects/[projectId]/consolidation/page.tsx",
    "utf8",
  );


describe(
  "Consolidation Center security",
  () => {
    it(
      "authorizes project access before workspace reporting",
      () => {
        expect(
          page,
        ).toContain(
          "getOwnedProject",
        );
      },
    );


    it(
      "requires Workspace Owner for FX mutation",
      () => {
        expect(
          actions,
        ).toContain(
          "requireProjectWorkspaceOwner",
        );
      },
    );


    it(
      "scopes FX rates to authorized workspace",
      () => {
        expect(
          actions,
        ).toContain(
          "workspaceId",
        );


        expect(
          page,
        ).toMatch(
          /workspaceFxRate\.findMany\(\{[\s\S]*workspaceId/,
        );
      },
    );


    it(
      "scopes consolidated projects to the current workspace",
      () => {
        expect(
          page,
        ).toMatch(
          /project\.findMany\(\{[\s\S]*workspaceId/,
        );
      },
    );
  },
);
