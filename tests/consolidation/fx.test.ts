import {
  describe,
  expect,
  it,
} from "vitest";

import {
  convertCurrencyAmount,
  resolveWorkspaceFxRate,
} from "@/lib/finance/consolidation/fx";


const rates = [
  {
    id:
      "old",

    baseCurrency:
      "EUR" as const,

    quoteCurrency:
      "USD" as const,

    rate:
      1.05,

    effectiveDate:
      "2027-01-01",

    sourceLabel:
      "Old planning rate",

    createdBy:
      null,

    createdAt:
      "2027-01-01T00:00:00.000Z",
  },

  {
    id:
      "new",

    baseCurrency:
      "EUR" as const,

    quoteCurrency:
      "USD" as const,

    rate:
      1.10,

    effectiveDate:
      "2027-02-01",

    sourceLabel:
      "New planning rate",

    createdBy:
      null,

    createdAt:
      "2027-02-01T00:00:00.000Z",
  },
];


describe(
  "workspace FX resolution",
  () => {
    it(
      "uses identity rate for same currency",
      () => {
        expect(
          resolveWorkspaceFxRate({
            sourceCurrency:
              "EUR",

            reportingCurrency:
              "EUR",

            asOfDate:
              "2027-02-28",

            rates,
          })?.rate,
        ).toBe(
          1,
        );
      },
    );


    it(
      "uses latest direct rate as of date",
      () => {
        const result =
          resolveWorkspaceFxRate({
            sourceCurrency:
              "EUR",

            reportingCurrency:
              "USD",

            asOfDate:
              "2027-02-28",

            rates,
          });


        expect(
          result?.rate,
        ).toBe(
          1.10,
        );


        expect(
          result?.effectiveDate,
        ).toBe(
          "2027-02-01",
        );
      },
    );


    it(
      "does not use a future rate",
      () => {
        expect(
          resolveWorkspaceFxRate({
            sourceCurrency:
              "EUR",

            reportingCurrency:
              "USD",

            asOfDate:
              "2027-01-15",

            rates,
          })?.rate,
        ).toBe(
          1.05,
        );
      },
    );


    it(
      "supports inverse conversion",
      () => {
        const result =
          resolveWorkspaceFxRate({
            sourceCurrency:
              "USD",

            reportingCurrency:
              "EUR",

            asOfDate:
              "2027-02-28",

            rates,
          });


        expect(
          result?.direction,
        ).toBe(
          "INVERSE",
        );


        expect(
          result?.rate,
        ).toBeCloseTo(
          1 /
          1.10,
        );
      },
    );


    it(
      "returns null when no direct or inverse rate exists",
      () => {
        expect(
          resolveWorkspaceFxRate({
            sourceCurrency:
              "GBP",

            reportingCurrency:
              "TND",

            asOfDate:
              "2027-02-28",

            rates,
          }),
        ).toBeNull();
      },
    );


    it(
      "converts using decimal arithmetic",
      () => {
        const fx =
          resolveWorkspaceFxRate({
            sourceCurrency:
              "EUR",

            reportingCurrency:
              "USD",

            asOfDate:
              "2027-02-28",

            rates,
          });


        if (
          !fx
        ) {
          throw new Error(
            "Rate missing.",
          );
        }


        expect(
          convertCurrencyAmount({
            amount:
              100,

            fx,
          }),
        ).toBe(
          110,
        );
      },
    );
  },
);
