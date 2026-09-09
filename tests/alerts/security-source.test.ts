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
    "app/(app)/projects/[projectId]/alerts/actions.ts",
    "utf8",
  );


const service =
  readFileSync(
    "lib/notifications/service.ts",
    "utf8",
  );


const page =
  readFileSync(
    "app/(app)/projects/[projectId]/alerts/page.tsx",
    "utf8",
  );


describe(
  "Alert Inbox security",
  () => {
    it(
      "authorizes project access before personal receipt mutation",
      () => {
        expect(
          actions,
        ).toContain(
          "getOwnedProject",
        );


        expect(
          actions,
        ).toContain(
          "requireAlertProjectAccess",
        );
      },
    );


    it(
      "does not require Editor rights for personal inbox state",
      () => {
        expect(
          actions,
        ).not.toContain(
          "requireProjectEditor",
        );
      },
    );


    it(
      "scopes personal receipt updates to user and project",
      () => {
        expect(
          service,
        ).toContain(
          "userId_projectId_alertKey",
        );


        expect(
          service,
        ).toContain(
          "projectId",
        );


        expect(
          service,
        ).toContain(
          "userId",
        );
      },
    );


    it(
      "loads only the signed-in user's receipts",
      () => {
        expect(
          page,
        ).toContain(
          "projectAlertReceipt.findMany",
        );


        expect(
          page,
        ).toMatch(
          /userId:\s*user\.id/,
        );
      },
    );


    it(
      "never mutates project business authorities",
      () => {
        expect(
          service,
        ).not.toContain(
          "project.update",
        );


        expect(
          service,
        ).not.toContain(
          "decisionAction.update",
        );


        expect(
          service,
        ).not.toContain(
          "actualPeriod.update",
        );


        expect(
          service,
        ).not.toContain(
          "projectRiskPolicy.update",
        );
      },
    );
  },
);
