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
    "lib/data-import/service.ts",
    "utf8",
  );


describe(
  "Data Import application architecture",
  () => {
    it(
      "applies business rows inside a Prisma transaction",
      () => {
        expect(
          service,
        ).toContain(
          "prisma.$transaction",
        );


        expect(
          service,
        ).toContain(
          "transaction.actualPeriod",
        );


        expect(
          service,
        ).toContain(
          "transaction.projectKpiTarget",
        );


        expect(
          service,
        ).toContain(
          "transaction.varianceCommentary",
        );
      },
    );


    it(
      "records successful import audit evidence transactionally",
      () => {
        expect(
          service,
        ).toContain(
          "DATA_IMPORT_APPLIED",
        );


        expect(
          service,
        ).toContain(
          "transaction.projectAuditEvent.create",
        );
      },
    );


    it(
      "records failed imports separately after rollback",
      () => {
        expect(
          service,
        ).toContain(
          "DATA_IMPORT_FAILED",
        );


        expect(
          service,
        ).toContain(
          'status:\n              "FAILED"',
        );
      },
    );


    it(
      "does not bypass Financial Close",
      () => {
        expect(
          service,
        ).not.toContain(
          "financialPeriodState.update",
        );


        expect(
          service,
        ).not.toContain(
          "reopenFinancialPeriod",
        );
      },
    );


    it(
      "uses project-scoped identities before update",
      () => {
        expect(
          service,
        ).toMatch(
          /actualPeriod\.findFirst\(\{[\s\S]*projectId,[\s\S]*period/,
        );


        expect(
          service,
        ).toContain(
          "projectId_periodKey_metricCode",
        );
      },
    );
  },
);
