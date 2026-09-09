import {
  readFileSync,
} from "node:fs";

import {
  describe,
  expect,
  it,
} from "vitest";


const schema =
  readFileSync(
    "prisma/schema.prisma",
    "utf8",
  );


const closeMigration =
  readFileSync(
    "prisma/migrations/20260909181500_step36_financial_period_close/migration.sql",
    "utf8",
  );


const auditMigration =
  readFileSync(
    "prisma/migrations/20260909190000_step37_project_audit_ledger/migration.sql",
    "utf8",
  );


const approvalService =
  readFileSync(
    "lib/approvals/service.ts",
    "utf8",
  );


const consolidationFx =
  readFileSync(
    "lib/finance/consolidation/fx.ts",
    "utf8",
  );


describe(
  "final governance authority regression",
  () => {
    it(
      "retains collaborative workspace roles",
      () => {
        expect(
          schema,
        ).toContain(
          "model WorkspaceMember",
        );
      },
    );


    it(
      "retains database-level Financial Close protection",
      () => {
        expect(
          closeMigration,
        ).toContain(
          "ActualPeriod_closed_period_guard",
        );


        expect(
          closeMigration,
        ).toContain(
          "BEFORE INSERT OR UPDATE OR DELETE",
        );
      },
    );


    it(
      "retains immutable Project Audit protection",
      () => {
        expect(
          auditMigration,
        ).toContain(
          "ProjectAuditEvent_immutable_guard",
        );
      },
    );


    it(
      "retains requester-versus-approver separation",
      () => {
        expect(
          approvalService,
        ).toContain(
          "Requester and approver must be different users.",
        );
      },
    );


    it(
      "retains locally governed FX resolution",
      () => {
        expect(
          consolidationFx,
        ).toContain(
          "resolveWorkspaceFxRate",
        );


        expect(
          consolidationFx,
        ).not.toContain(
          "fetch(",
        );
      },
    );


    it(
      "retains key final persistence authorities",
      () => {
        for (
          const model
          of [
            "ProjectRevision",
            "ActualPeriod",
            "ForecastBaseline",
            "ProjectRiskPolicy",
            "DecisionAction",
            "ExecutiveReview",
            "ProjectKpiTarget",
            "VarianceCommentary",
            "FinancialPeriodState",
            "ProjectAuditEvent",
            "ProjectAlertReceipt",
            "ApprovalRequest",
            "DataImportBatch",
            "WorkspaceConsolidationSettings",
            "WorkspaceFxRate",
          ]
        ) {
          expect(
            schema,
          ).toContain(
            `model ${model}`,
          );
        }
      },
    );
  },
);
