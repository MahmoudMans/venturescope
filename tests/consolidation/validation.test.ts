import {
  describe,
  expect,
  it,
} from "vitest";

import {
  assertDistinctCurrencyPair,
  parseFxDate,
  parseFxRate,
  parseVentureScopeCurrency,
} from "@/lib/finance/consolidation/validation";


describe(
  "consolidation validation",
  () => {
    it(
      "validates supported currencies",
      () => {
        expect(
          parseVentureScopeCurrency(
            "eur",
          ),
        ).toBe(
          "EUR",
        );


        expect(
          () =>
            parseVentureScopeCurrency(
              "JPY",
            ),
        ).toThrow();
      },
    );


    it(
      "validates positive FX rates",
      () => {
        expect(
          parseFxRate(
            "1.1055",
          ),
        ).toBe(
          1.1055,
        );


        expect(
          () =>
            parseFxRate(
              "0",
            ),
        ).toThrow();
      },
    );


    it(
      "validates date-only effective dates",
      () => {
        expect(
          parseFxDate(
            "2027-01-31",
          ),
        ).toBe(
          "2027-01-31",
        );
      },
    );


    it(
      "rejects same-currency manual pairs",
      () => {
        expect(
          () =>
            assertDistinctCurrencyPair({
              baseCurrency:
                "EUR",

              quoteCurrency:
                "EUR",
            }),
        ).toThrow(
          /different/i,
        );
      },
    );
  },
);
