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
    "app/(app)/projects/[projectId]/activity/page.tsx",
    "utf8",
  );


const component =
  readFileSync(
    "components/activity/activity-center.tsx",
    "utf8",
  );


describe(
  "Activity Center security",
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
      "scopes audit queries to project ID",
      () => {
        expect(
          page,
        ).toContain(
          "projectId",
        );


        expect(
          page,
        ).toContain(
          "projectAuditEvent.findMany",
        );
      },
    );


    it(
      "creates no Activity Center mutation action",
      () => {
        expect(
          existsSync(
            "app/(app)/projects/[projectId]/activity/actions.ts",
          ),
        ).toBe(
          false,
        );
      },
    );


    it(
      "contains no delete or edit control",
      () => {
        expect(
          component,
        ).not.toContain(
          "Delete event",
        );


        expect(
          component,
        ).not.toContain(
          "Edit event",
        );
      },
    );
  },
);
