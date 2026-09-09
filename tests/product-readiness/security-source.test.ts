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
    "app/(app)/projects/[projectId]/release-readiness/page.tsx",
    "utf8",
  );


const component =
  readFileSync(
    "components/product-readiness/release-readiness-workspace.tsx",
    "utf8",
  );


describe(
  "Release Readiness security",
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
      "creates no mutation Server Action",
      () => {
        expect(
          existsSync(
            "app/(app)/projects/[projectId]/release-readiness/actions.ts",
          ),
        ).toBe(
          false,
        );
      },
    );


    it(
      "contains no mutation/network client authority",
      () => {
        expect(
          component,
        ).not.toContain(
          "fetch(",
        );


        expect(
          component,
        ).not.toContain(
          "/actions",
        );
      },
    );


    it(
      "keeps the command-line release gate authoritative",
      () => {
        expect(
          component,
        ).toContain(
          "pnpm release:gate",
        );


        expect(
          component,
        ).toContain(
          "does not certify its own release",
        );
      },
    );
  },
);
