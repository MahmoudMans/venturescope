import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildConsolidatedPortfolioReport,
} from "@/lib/finance/consolidation/calculations";


describe(
  "consolidated reporting",
  () => {
    it(
      "consolidates same and foreign currency amounts",
      () => {
        const report =
          buildConsolidatedPortfolioReport({
            reportingCurrency:
              "EUR",

            asOfDate:
              "2027-02-28",

            rates: [
              {
                id:
                  "1",

                baseCurrency:
                  "EUR",

                quoteCurrency:
                  "USD",

                rate:
                  1.10,

                effectiveDate:
                  "2027-02-01",

                sourceLabel:
                  "Planning rate",

                createdBy:
                  null,

                createdAt:
                  "2027-02-01T00:00:00.000Z",
              },
            ],

            projects: [
              {
                projectId:
                  "eur",

                name:
                  "EUR Project",

                industry:
                  "Software",

                currency:
                  "EUR",

                latestActualPeriod:
                  "2027-02",

                latestActualCash:
                  1000,

                capitalNeed:
                  200,

                forecastAvailable:
                  true,
              },

              {
                projectId:
                  "usd",

                name:
                  "USD Project",

                industry:
                  "Retail",

                currency:
                  "USD",

                latestActualPeriod:
                  "2027-02",

                latestActualCash:
                  1100,

                capitalNeed:
                  220,

                forecastAvailable:
                  true,
              },
            ],
          });


        expect(
          report.totalCash,
        ).toBeCloseTo(
          2000,
        );


        expect(
          report.totalCapitalNeed,
        ).toBeCloseTo(
          400,
        );


        expect(
          report.complete,
        ).toBe(
          true,
        );
      },
    );


    it(
      "does not guess missing FX",
      () => {
        const report =
          buildConsolidatedPortfolioReport({
            reportingCurrency:
              "EUR",

            asOfDate:
              "2027-02-28",

            rates:
              [],

            projects: [
              {
                projectId:
                  "usd",

                name:
                  "USD Project",

                industry:
                  "",

                currency:
                  "USD",

                latestActualPeriod:
                  "2027-02",

                latestActualCash:
                  1000,

                capitalNeed:
                  500,

                forecastAvailable:
                  true,
              },
            ],
          });


        expect(
          report.totalCash,
        ).toBe(
          0,
        );


        expect(
          report.missingCashRates,
        ).toBe(
          1,
        );


        expect(
          report.missingCapitalRates,
        ).toBe(
          1,
        );


        expect(
          report.complete,
        ).toBe(
          false,
        );
      },
    );


    it(
      "does not require FX for a zero amount",
      () => {
        const report =
          buildConsolidatedPortfolioReport({
            reportingCurrency:
              "EUR",

            asOfDate:
              "2027-02-28",

            rates:
              [],

            projects: [
              {
                projectId:
                  "usd",

                name:
                  "USD Project",

                industry:
                  "",

                currency:
                  "USD",

                latestActualPeriod:
                  "2027-02",

                latestActualCash:
                  0,

                capitalNeed:
                  0,

                forecastAvailable:
                  true,
              },
            ],
          });


        expect(
          report.missingCashRates,
        ).toBe(
          0,
        );


        expect(
          report.missingCapitalRates,
        ).toBe(
          0,
        );
      },
    );
  },
);
