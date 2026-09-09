import {
  describe,
  expect,
  it,
} from "vitest";

import {
  parseProjectAuditCategory,
  parseProjectAuditSeverity,
  sanitizeAuditAction,
} from "@/lib/audit/catalog";


describe(
  "audit catalog",
  () => {
    it(
      "validates audit categories",
      () => {
        expect(
          parseProjectAuditCategory(
            "FINANCIAL_CLOSE",
          ),
        ).toBe(
          "FINANCIAL_CLOSE",
        );
      },
    );


    it(
      "validates audit severities",
      () => {
        expect(
          parseProjectAuditSeverity(
            "CRITICAL",
          ),
        ).toBe(
          "CRITICAL",
        );
      },
    );


    it(
      "normalizes valid action names",
      () => {
        expect(
          sanitizeAuditAction(
            "kpi_target_created",
          ),
        ).toBe(
          "KPI_TARGET_CREATED",
        );
      },
    );


    it(
      "rejects malformed actions",
      () => {
        expect(
          () =>
            sanitizeAuditAction(
              "deleted everything!",
            ),
        ).toThrow(
          /uppercase letters/i,
        );
      },
    );
  },
);
