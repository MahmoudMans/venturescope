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
    "app/(app)/projects/[projectId]/period-close/actions.ts",
    "utf8",
  );


const access =
  readFileSync(
    "lib/finance/period-close/access.ts",
    "utf8",
  );


const page =
  readFileSync(
    "app/(app)/projects/[projectId]/period-close/page.tsx",
    "utf8",
  );


describe(
  "Financial Close authorization",
  () => {
    it(
      "requires Editor authority for period close",
      () => {
        expect(
          actions.match(
            /\brequireProjectEditor\s*\(/g,
          ) ??
          [],
        ).toHaveLength(
          1,
        );
      },
    );


    it(
      "requires explicit Workspace Owner authority for reopen",
      () => {
        expect(
          actions.match(
            /\brequireProjectWorkspaceOwner\s*\(/g,
          ) ??
          [],
        ).toHaveLength(
          1,
        );


        expect(
          access,
        ).toContain(
          'role:\n          "OWNER"',
        );
      },
    );


    it(
      "uses exact close and reopen confirmation contracts",
      () => {
        expect(
          actions,
        ).toContain(
          "validateCloseConfirmation",
        );


        expect(
          actions,
        ).toContain(
          "validateReopenConfirmation",
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
  },
);
