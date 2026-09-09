import {
  describe,
  expect,
  it,
} from "vitest";

import {
  amortizedMonthlyPayment,
  equityDilution,
} from "@/lib/finance/capital-planning/calculations";


describe(
  "capital financing mathematics",
  () => {
    it(
      "amortizes zero-interest debt evenly",
      () => {
        expect(
          amortizedMonthlyPayment({
            principal:
              1200,

            annualRate:
              0,

            termMonths:
              12,
          }),
        ).toBe(
          100,
        );
      },
    );


    it(
      "includes interest in positive-rate debt service",
      () => {
        const payment =
          amortizedMonthlyPayment({
            principal:
              1200,

            annualRate:
              0.12,

            termMonths:
              12,
          });


        expect(
          payment,
        ).toBeGreaterThan(
          100,
        );
      },
    );


    it(
      "calculates post-money equity dilution",
      () => {
        expect(
          equityDilution({
            equityAmount:
              20,

            preMoneyValuation:
              80,
          }),
        ).toBeCloseTo(
          0.20,
        );
      },
    );


    it(
      "returns zero dilution when no equity is issued",
      () => {
        expect(
          equityDilution({
            equityAmount:
              0,

            preMoneyValuation:
              100,
          }),
        ).toBe(
          0,
        );
      },
    );
  },
);
