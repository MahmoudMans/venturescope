import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateCapitalStrategy,
} from "@/lib/finance/capital-planning/calculations";


const path = [
  {
    period:
      "2027-01",

    cashBalance:
      100,
  },

  {
    period:
      "2027-02",

    cashBalance:
      50,
  },

  {
    period:
      "2027-03",

    cashBalance:
      0,
  },

  {
    period:
      "2027-04",

    cashBalance:
      -50,
  },
];


const inputs = {
  targetCashFloor:
    0,

  raisePeriodIndex:
    0,

  capitalAmount:
    200,

  preMoneyValuation:
    800,

  annualDebtRate:
    0.12,

  debtTermMonths:
    12,

  hybridEquityShare:
    0.50,
};


describe(
  "capital structure comparison",
  () => {
    it(
      "equity creates dilution without debt service",
      () => {
        const result =
          calculateCapitalStrategy({
            kind:
              "EQUITY",

            path,

            inputs,
          });


        expect(
          result.debtAmount,
        ).toBe(
          0,
        );


        expect(
          result.monthlyDebtService,
        ).toBe(
          0,
        );


        expect(
          result.dilution,
        ).toBeCloseTo(
          0.20,
        );
      },
    );


    it(
      "debt creates debt service without dilution",
      () => {
        const result =
          calculateCapitalStrategy({
            kind:
              "DEBT",

            path,

            inputs,
          });


        expect(
          result.equityAmount,
        ).toBe(
          0,
        );


        expect(
          result.dilution,
        ).toBe(
          0,
        );


        expect(
          result.monthlyDebtService,
        ).toBeGreaterThan(
          0,
        );
      },
    );


    it(
      "hybrid splits capital between equity and debt",
      () => {
        const result =
          calculateCapitalStrategy({
            kind:
              "HYBRID",

            path,

            inputs,
          });


        expect(
          result.equityAmount,
        ).toBeCloseTo(
          100,
        );


        expect(
          result.debtAmount,
        ).toBeCloseTo(
          100,
        );


        expect(
          result.dilution,
        ).toBeGreaterThan(
          0,
        );


        expect(
          result.monthlyDebtService,
        ).toBeGreaterThan(
          0,
        );
      },
    );


    it(
      "debt produces lower cash than equity after debt service begins",
      () => {
        const equity =
          calculateCapitalStrategy({
            kind:
              "EQUITY",

            path,

            inputs,
          });


        const debt =
          calculateCapitalStrategy({
            kind:
              "DEBT",

            path,

            inputs,
          });


        expect(
          debt.endingCash,
        ).toBeLessThan(
          equity.endingCash ??
          Number.POSITIVE_INFINITY,
        );
      },
    );
  },
);
