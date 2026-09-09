import {
  readFileSync,
} from "node:fs";

import {
  describe,
  expect,
  it,
} from "vitest";


const action =
  readFileSync(
    "app/(app)/projects/[projectId]/board-room/actions.ts",
    "utf8",
  );


const service =
  readFileSync(
    "lib/finance/board-room/service.ts",
    "utf8",
  );


const page =
  readFileSync(
    "app/(app)/projects/[projectId]/board-room/page.tsx",
    "utf8",
  );


const component =
  readFileSync(
    "components/board-room/board-room-workspace.tsx",
    "utf8",
  );


describe(
  "Board Room security architecture",
  () => {
    it(
      "requires Editor permission to freeze reviews",
      () => {
        expect(
          action.match(
            /\brequireProjectEditor\s*\(/g,
          ) ??
          [],
        ).toHaveLength(
          1,
        );
      },
    );


    it(
      "computes snapshot inputs server-side",
      () => {
        expect(
          action,
        ).toContain(
          "actualPeriod.findMany",
        );


        expect(
          action,
        ).toContain(
          "projectRiskPolicy.findUnique",
        );


        expect(
          action,
        ).toContain(
          "decisionAction.findMany",
        );


        expect(
          action,
        ).toContain(
          "buildExecutiveReviewSnapshot",
        );
      },
    );


    it(
      "never updates or upserts frozen reviews",
      () => {
        expect(
          service,
        ).not.toContain(
          "executiveReview.update",
        );


        expect(
          service,
        ).not.toContain(
          "executiveReview.upsert",
        );


        expect(
          service,
        ).not.toContain(
          "executiveReview.delete",
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


    it(
      "uses authoritative forecast CSV",
      () => {
        expect(
          component,
        ).toContain(
          "/export/csv",
        );
      },
    );
  },
);
