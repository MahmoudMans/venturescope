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
    "app/(app)/projects/[projectId]/version-diff/page.tsx",
    "utf8",
  );


const component =
  readFileSync(
    "components/version-diff/version-diff-workspace.tsx",
    "utf8",
  );


const diff =
  readFileSync(
    "lib/projects/version-diff/diff.ts",
    "utf8",
  );


describe(
  "Model Diff architecture",
  () => {
    it(
      "uses collaborative read authority",
      () => {
        expect(
          page,
        ).toContain(
          "getOwnedProject",
        );
      },
    );


    it(
      "reads immutable ProjectRevision snapshots directly",
      () => {
        expect(
          page,
        ).toContain(
          "projectRevision.findMany",
        );


        expect(
          page,
        ).toContain(
          "snapshot:",
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
      "does not create a mutation action for Model Diff",
      () => {
        expect(
          existsSync(
            "app/(app)/projects/[projectId]/version-diff/actions.ts",
          ),
        ).toBe(
          false,
        );
      },
    );


    it(
      "keeps recursive comparison outside UI",
      () => {
        expect(
          diff,
        ).toContain(
          "compareRevisionSnapshots",
        );


        expect(
          component,
        ).not.toContain(
          "function diffValue",
        );
      },
    );
  },
);
