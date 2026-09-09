import {
  readFileSync,
} from "node:fs";

import {
  describe,
  expect,
  it,
} from "vitest";


const closeMigration =
  readFileSync(
    "prisma/migrations/20260909181500_step36_financial_period_close/migration.sql",
    "utf8",
  );


const importService =
  readFileSync(
    "lib/data-import/service.ts",
    "utf8",
  );


describe(
  "Actuals import Financial Close preservation",
  () => {
    it(
      "retains database-level ActualPeriod guard",
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
      "writes ActualPeriod through normal Prisma mutations",
      () => {
        expect(
          importService,
        ).toContain(
          "transaction.actualPeriod.update",
        );


        expect(
          importService,
        ).toContain(
          "transaction.actualPeriod.create",
        );
      },
    );


    it(
      "contains no trigger bypass mechanism",
      () => {
        expect(
          importService.toLowerCase(),
        ).not.toContain(
          "disable trigger",
        );


        expect(
          importService.toLowerCase(),
        ).not.toContain(
          "session_replication_role",
        );
      },
    );
  },
);
