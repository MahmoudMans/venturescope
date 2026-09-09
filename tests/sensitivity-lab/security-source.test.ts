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
    "app/(app)/projects/[projectId]/sensitivity-lab/page.tsx",
    "utf8",
  );


const component =
  readFileSync(
    "components/sensitivity-lab/sensitivity-lab-workspace.tsx",
    "utf8",
  );


describe(
  "Sensitivity Lab security",
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
      "does not require Editor permission",
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
      "creates no mutation Server Action",
      () => {
        expect(
          existsSync(
            "app/(app)/projects/[projectId]/sensitivity-lab/actions.ts",
          ),
        ).toBe(
          false,
        );
      },
    );


    it(
      "uses authenticated forecast export authority",
      () => {
        expect(
          component,
        ).toContain(
          "/export/csv",
        );
      },
    );


    it(
      "does not mutate risk policy",
      () => {
        expect(
          component,
        ).not.toContain(
          "saveRiskPolicyAction",
        );
      },
    );
  },
);
