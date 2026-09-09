import {
  describe,
  expect,
  it,
} from "vitest";

import {
  newForecastBaselineSnapshot,
  parseBaselineKind,
  parseForecastBaselineSnapshot,
} from "@/lib/finance/planning-cycle/baseline";


const row = {
  period:
    "2027-01",

  revenue:
    100,

  cogs:
    30,

  grossProfit:
    70,

  operatingExpenses:
    50,

  ebitda:
    20,

  netIncome:
    15,

  cashFlow:
    10,

  cashBalance:
    1000,

  mrr:
    80,

  customers:
    10,

  cac:
    null,

  churnRate:
    null,
};


describe(
  "forecast baseline snapshots",
  () => {
    it(
      "creates schema-v1 baseline snapshots",
      () => {
        const snapshot =
          newForecastBaselineSnapshot([
            row,
          ]);


        expect(
          snapshot.schemaVersion,
        ).toBe(
          1,
        );


        expect(
          snapshot.rows,
        ).toHaveLength(
          1,
        );
      },
    );


    it(
      "validates supported baseline kinds",
      () => {
        expect(
          parseBaselineKind(
            "BUDGET",
          ),
        ).toBe(
          "BUDGET",
        );


        expect(
          () =>
            parseBaselineKind(
              "INVALID",
            ),
        ).toThrow(
          /kind/i,
        );
      },
    );


    it(
      "rejects unsupported snapshot schemas",
      () => {
        expect(
          () =>
            parseForecastBaselineSnapshot({
              schemaVersion:
                99,

              capturedAt:
                new Date()
                  .toISOString(),

              rows: [
                row,
              ],
            }),
        ).toThrow(
          /Invalid forecast baseline/,
        );
      },
    );
  },
);
