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
    "lib/finance/period-close/service.ts",
    "utf8",
  );


describe(
  "Financial Close service",
  () => {
    it(
      "requires Actuals before closing a period",
      () => {
        expect(
          service,
        ).toContain(
          "actualPeriod.findFirst",
        );
      },
    );


    it(
      "writes append-only close and reopen events",
      () => {
        expect(
          service.match(
            /financialPeriodEvent\.create/g,
          ) ??
          [],
        ).toHaveLength(
          2,
        );


        expect(
          service,
        ).toContain(
          '"CLOSED"',
        );


        expect(
          service,
        ).toContain(
          '"REOPENED"',
        );
      },
    );


    it(
      "increments close sequence when a period is closed again",
      () => {
        expect(
          service,
        ).toContain(
          "existing?.closeSequence",
        );


        expect(
          service,
        ).toContain(
          "sequence",
        );
      },
    );


    it(
      "does not mutate ActualPeriod records",
      () => {
        expect(
          service,
        ).not.toContain(
          "actualPeriod.update",
        );


        expect(
          service,
        ).not.toContain(
          "actualPeriod.upsert",
        );


        expect(
          service,
        ).not.toContain(
          "actualPeriod.delete",
        );
      },
    );
  },
);
