import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildFinancialPeriodRegister,
} from "@/lib/finance/period-close/register";


describe(
  "financial-period register",
  () => {
    it(
      "treats periods without state records as OPEN",
      () => {
        const register =
          buildFinancialPeriodRegister({
            actuals: [
              {
                periodKey:
                  "2027-01",

                revenue:
                  100,

                ebitda:
                  20,

                cashBalance:
                  500,
              },
            ],

            states:
              [],
          });


        expect(
          register.rows[
            0
          ].status,
        ).toBe(
          "OPEN",
        );


        expect(
          register.summary
            .openPeriods,
        ).toBe(
          1,
        );
      },
    );


    it(
      "reflects CLOSED state and close cycles",
      () => {
        const register =
          buildFinancialPeriodRegister({
            actuals: [
              {
                periodKey:
                  "2027-01",

                revenue:
                  100,

                ebitda:
                  20,

                cashBalance:
                  500,
              },

              {
                periodKey:
                  "2027-02",

                revenue:
                  110,

                ebitda:
                  25,

                cashBalance:
                  550,
              },
            ],

            states: [
              {
                id:
                  "state-1",

                periodKey:
                  "2027-01",

                status:
                  "CLOSED",

                closeSequence:
                  2,

                closedAt:
                  "2027-02-10T00:00:00.000Z",

                closedByUserId:
                  "user-1",

                reopenedAt:
                  null,

                reopenedByUserId:
                  null,
              },
            ],
          });


        expect(
          register.summary
            .closedPeriods,
        ).toBe(
          1,
        );


        expect(
          register.summary
            .openPeriods,
        ).toBe(
          1,
        );


        expect(
          register.summary
            .closeCycles,
        ).toBe(
          2,
        );
      },
    );


    it(
      "sorts periods newest first",
      () => {
        const register =
          buildFinancialPeriodRegister({
            actuals: [
              {
                periodKey:
                  "2027-01",

                revenue:
                  null,

                ebitda:
                  null,

                cashBalance:
                  null,
              },

              {
                periodKey:
                  "2027-03",

                revenue:
                  null,

                ebitda:
                  null,

                cashBalance:
                  null,
              },
            ],

            states:
              [],
          });


        expect(
          register.rows.map(
            (
              row,
            ) =>
              row.periodKey,
          ),
        ).toEqual([
          "2027-03",
          "2027-01",
        ]);
      },
    );
  },
);
