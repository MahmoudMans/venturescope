import {
  describe,
  expect,
  it,
} from "vitest";

import {
  approvalStatusFromDecision,
  assertApprovalPending,
  parseApprovalDecision,
  parseApprovalRequestStatus,
  parseApprovalRequestType,
  parseApprovalSubjectValue,
} from "@/lib/approvals/validation";


describe(
  "approval validation",
  () => {
    it(
      "validates request types",
      () => {
        expect(
          parseApprovalRequestType(
            "FINANCIAL_PERIOD_REOPEN",
          ),
        ).toBe(
          "FINANCIAL_PERIOD_REOPEN",
        );


        expect(
          () =>
            parseApprovalRequestType(
              "DELETE_DATABASE",
            ),
        ).toThrow(
          /request type/i,
        );
      },
    );


    it(
      "validates lifecycle statuses",
      () => {
        expect(
          parseApprovalRequestStatus(
            "PENDING",
          ),
        ).toBe(
          "PENDING",
        );


        expect(
          parseApprovalRequestStatus(
            "APPROVED",
          ),
        ).toBe(
          "APPROVED",
        );
      },
    );


    it(
      "maps owner decisions to terminal statuses",
      () => {
        expect(
          approvalStatusFromDecision(
            parseApprovalDecision(
              "APPROVE",
            ),
          ),
        ).toBe(
          "APPROVED",
        );


        expect(
          approvalStatusFromDecision(
            parseApprovalDecision(
              "REJECT",
            ),
          ),
        ).toBe(
          "REJECTED",
        );
      },
    );


    it(
      "only permits pending requests to transition",
      () => {
        expect(
          () =>
            assertApprovalPending(
              "PENDING",
            ),
        ).not.toThrow();


        expect(
          () =>
            assertApprovalPending(
              "APPROVED",
            ),
        ).toThrow(
          /pending/i,
        );
      },
    );


    it(
      "supports generic subject references",
      () => {
        expect(
          parseApprovalSubjectValue(
            "FinancialPeriod",
            "Subject type",
          ),
        ).toBe(
          "FinancialPeriod",
        );


        expect(
          parseApprovalSubjectValue(
            "",
            "Subject ID",
          ),
        ).toBeNull();
      },
    );
  },
);
