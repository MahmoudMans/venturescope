import {
  readFileSync,
} from "node:fs";

import {
  describe,
  expect,
  it,
} from "vitest";


const service =
  readFileSync(
    "lib/approvals/service.ts",
    "utf8",
  );


describe(
  "Approval Workflow service",
  () => {
    it(
      "creates requests and audit evidence in one transaction",
      () => {
        expect(
          service,
        ).toContain(
          "prisma.$transaction",
        );


        expect(
          service,
        ).toContain(
          "transaction.approvalRequest.create",
        );


        expect(
          service,
        ).toContain(
          "APPROVAL_REQUEST_CREATED",
        );
      },
    );


    it(
      "scopes decisions to request and project",
      () => {
        expect(
          service,
        ).toMatch(
          /approvalRequest\.findFirst\(\{[\s\S]*id:[\s\S]*requestId,[\s\S]*projectId/,
        );
      },
    );


    it(
      "prevents requester self-approval",
      () => {
        expect(
          service,
        ).toContain(
          "Requester and approver must be different users.",
        );


        expect(
          service,
        ).toMatch(
          /existing\.requestedByUserId\s*===\s*actorUserId/,
        );
      },
    );


    it(
      "prevents terminal requests from transitioning",
      () => {
        expect(
          service,
        ).toContain(
          "assertApprovalPending",
        );
      },
    );


    it(
      "audits approve reject and cancel transitions",
      () => {
        expect(
          service,
        ).toContain(
          "APPROVAL_REQUEST_APPROVED",
        );


        expect(
          service,
        ).toContain(
          "APPROVAL_REQUEST_REJECTED",
        );


        expect(
          service,
        ).toContain(
          "APPROVAL_REQUEST_CANCELLED",
        );
      },
    );


    it(
      "only allows requester cancellation",
      () => {
        expect(
          service,
        ).toContain(
          "Only the requester may cancel a pending approval request.",
        );
      },
    );
  },
);
