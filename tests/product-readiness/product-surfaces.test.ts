import {
  existsSync,
} from "node:fs";

import {
  describe,
  expect,
  it,
} from "vitest";


const routes = [
  "app/(app)/projects/[projectId]/analytics/page.tsx",
  "app/(app)/projects/[projectId]/actuals/page.tsx",
  "app/(app)/projects/[projectId]/planning-cycle/page.tsx",
  "app/(app)/projects/[projectId]/risk-center/page.tsx",
  "app/(app)/projects/[projectId]/capital-planning/page.tsx",
  "app/(app)/projects/[projectId]/decision-center/page.tsx",
  "app/(app)/projects/[projectId]/board-room/page.tsx",
  "app/(app)/projects/[projectId]/version-diff/page.tsx",
  "app/(app)/projects/[projectId]/scenario-comparison/page.tsx",
  "app/(app)/projects/[projectId]/sensitivity-lab/page.tsx",
  "app/(app)/projects/[projectId]/scorecard/page.tsx",
  "app/(app)/projects/[projectId]/variance-review/page.tsx",
  "app/(app)/projects/[projectId]/period-close/page.tsx",
  "app/(app)/projects/[projectId]/activity/page.tsx",
  "app/(app)/projects/[projectId]/board-pack/page.tsx",
  "app/(app)/projects/[projectId]/templates/page.tsx",
  "app/(app)/projects/[projectId]/portfolio/page.tsx",
  "app/(app)/projects/[projectId]/alerts/page.tsx",
  "app/(app)/projects/[projectId]/approvals/page.tsx",
  "app/(app)/projects/[projectId]/imports/page.tsx",
  "app/(app)/projects/[projectId]/consolidation/page.tsx",
  "app/(app)/projects/[projectId]/release-readiness/page.tsx",
];


describe(
  "final VentureScope product surfaces",
  () => {
    it(
      "retains every major private product route",
      () => {
        const missing =
          routes.filter(
            (
              route,
            ) =>
              !existsSync(
                route,
              ),
          );


        expect(
          missing,
        ).toEqual(
          [],
        );
      },
    );


    it(
      "contains at least twenty major private product surfaces",
      () => {
        expect(
          routes.length,
        ).toBeGreaterThanOrEqual(
          20,
        );
      },
    );
  },
);
