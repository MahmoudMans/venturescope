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
    "prisma/migrations/20260909181500_step36_financial_period_close/migration.sql",
    "utf8",
  );


describe(
  "ActualPeriod close database guard",
  () => {
    it(
      "creates the financial-close guard trigger",
      () => {
        expect(
          migration,
        ).toContain(
          "ActualPeriod_closed_period_guard",
        );


        expect(
          migration,
        ).toContain(
          "venturescope_assert_actual_period_open",
        );
      },
    );


    it(
      "guards INSERT UPDATE and DELETE",
      () => {
        expect(
          migration,
        ).toContain(
          "BEFORE INSERT OR UPDATE OR DELETE",
        );


        expect(
          migration,
        ).toContain(
          "TG_OP = 'INSERT'",
        );


        expect(
          migration,
        ).toContain(
          "TG_OP = 'UPDATE'",
        );


        expect(
          migration,
        ).toContain(
          "TG_OP = 'DELETE'",
        );
      },
    );


    it(
      "checks CLOSED financial period state",
      () => {
        expect(
          migration,
        ).toContain(
          '"FinancialPeriodState"',
        );


        expect(
          migration,
        ).toContain(
          `"status" = 'CLOSED'`,
        );


        expect(
          migration,
        ).toContain(
          "RAISE EXCEPTION",
        );
      },
    );
  },
);
