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


describe(
  "multi-currency persistence",
  () => {
    it(
      "persists workspace reporting currency",
      () => {
        expect(
          schema,
        ).toContain(
          "model WorkspaceConsolidationSettings",
        );


        expect(
          schema,
        ).toMatch(
          /reportingCurrency\s+String/,
        );
      },
    );


    it(
      "persists dated workspace FX rates",
      () => {
        expect(
          schema,
        ).toContain(
          "model WorkspaceFxRate",
        );


        expect(
          schema,
        ).toMatch(
          /rate\s+Decimal/,
        );


        expect(
          schema,
        ).toMatch(
          /effectiveDate\s+DateTime/,
        );


        expect(
          schema,
        ).toMatch(
          /sourceLabel\s+String/,
        );
      },
    );


    it(
      "uniquely identifies a dated currency pair",
      () => {
        expect(
          schema,
        ).toContain(
          "@@unique([workspaceId, baseCurrency, quoteCurrency, effectiveDate])",
        );
      },
    );
  },
);
