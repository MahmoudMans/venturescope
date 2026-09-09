import {
  describe,
  expect,
  it,
} from "vitest";

import {
  actualPeriodKey,
  parseActualMonth,
  parseActualsCsv,
} from "@/lib/finance/actuals";


describe(
  "Actuals CSV import",
  () => {
    it(
      "parses monthly financial actuals",
      () => {
        const rows =
          parseActualsCsv(
            [
              "Month,Revenue,COGS,Operating Expenses,EBITDA,Cash Balance,Customers",
              "2027-01,10000,3000,5000,2000,42000,100",
              "2027-02,12000,3500,5500,3000,45000,112",
            ].join(
              "\n",
            ),
          );


        expect(
          rows,
        ).toHaveLength(
          2,
        );


        expect(
          rows[
            0
          ].revenue,
        ).toBe(
          10000,
        );


        expect(
          actualPeriodKey(
            rows[
              1
            ].period,
          ),
        ).toBe(
          "2027-02",
        );
      },
    );


    it(
      "normalizes readable month values",
      () => {
        expect(
          actualPeriodKey(
            parseActualMonth(
              "Jan 2027",
            ),
          ),
        ).toBe(
          "2027-01",
        );
      },
    );


    it(
      "rejects duplicate months",
      () => {
        expect(
          () =>
            parseActualsCsv(
              [
                "Month,Revenue",
                "2027-01,100",
                "2027-01,200",
              ].join(
                "\n",
              ),
            ),
        ).toThrow(
          /duplicate month/i,
        );
      },
    );


    it(
      "rejects fractional customer counts",
      () => {
        expect(
          () =>
            parseActualsCsv(
              [
                "Month,Customers",
                "2027-01,10.5",
              ].join(
                "\n",
              ),
            ),
        ).toThrow(
          /non-negative integer/i,
        );
      },
    );
  },
);
