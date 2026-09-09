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
    "app/(app)/projects/[projectId]/approvals/actions.ts",
    "utf8",
  );


const service =
  readFileSync(
    "lib/approvals/service.ts",
    "utf8",
  );


describe(
  "approval separation of duties",
  () => {
    it(
      "requires Editor authority to create requests",
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
      "requires Workspace Owner authority to decide requests",
      () => {
        expect(
          actions.match(
            /\brequireProjectWorkspaceOwner\s*\(/g,
          ) ??
          [],
        ).toHaveLength(
          1,
        );
      },
    );


    it(
      "does not use Owner authority merely to cancel own request",
      () => {
        expect(
          actions,
        ).toContain(
          "getOwnedProject",
        );


        expect(
          service,
        ).toMatch(
          /existing\.requestedByUserId\s*!==\s*actorUserId/,
        );
      },
    );


    it(
      "requires decision rationale before approve or reject",
      () => {
        expect(
          actions,
        ).toContain(
          "Decision rationale must contain between 5 and 2000 characters.",
        );
      },
    );
  },
);
