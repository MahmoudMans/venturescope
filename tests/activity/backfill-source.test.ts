import {
  readFileSync,
} from "node:fs";

import {
  describe,
  expect,
  it,
} from "vitest";


const migration =
  readFileSync(
    "prisma/migrations/20260909190000_step37_project_audit_ledger/migration.sql",
    "utf8",
  );


describe(
  "audit history backfill",
  () => {
    it(
      "backfills Decision Actions",
      () => {
        expect(
          migration,
        ).toContain(
          'FROM "DecisionAction" action',
        );
      },
    );


    it(
      "backfills Executive Reviews",
      () => {
        expect(
          migration,
        ).toContain(
          'FROM "ExecutiveReview" review',
        );
      },
    );


    it(
      "backfills KPI targets",
      () => {
        expect(
          migration,
        ).toContain(
          'FROM "ProjectKpiTarget" target',
        );
      },
    );


    it(
      "backfills Variance Commentaries",
      () => {
        expect(
          migration,
        ).toContain(
          'FROM "VarianceCommentary" commentary',
        );
      },
    );


    it(
      "backfills Financial Close events",
      () => {
        expect(
          migration,
        ).toContain(
          'FROM "FinancialPeriodEvent" event',
        );
      },
    );
  },
);
