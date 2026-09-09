import {
  describe,
  expect,
  it,
} from "vitest";

import {
  financialPeriodDate,
  financialPeriodKeyFromDate,
  parseFinancialPeriodEventAction,
  parseFinancialPeriodKey,
  parseFinancialPeriodStatus,
  validateCloseConfirmation,
  validateReopenConfirmation,
} from "@/lib/finance/period-close/validation";


describe(
  "financial-period validation",
  () => {
    it(
      "normalizes month keys",
      () => {
        expect(
          parseFinancialPeriodKey(
            "Jan 2027",
          ),
        ).toBe(
          "2027-01",
        );
      },
    );


    it(
      "uses UTC first-of-month dates",
      () => {
        expect(
          financialPeriodDate(
            "2027-03",
          ).toISOString(),
        ).toBe(
          "2027-03-01T00:00:00.000Z",
        );


        expect(
          financialPeriodKeyFromDate(
            new Date(
              "2027-03-01T00:00:00.000Z",
            ),
          ),
        ).toBe(
          "2027-03",
        );
      },
    );


    it(
      "requires exact CLOSE confirmation",
      () => {
        expect(
          () =>
            validateCloseConfirmation({
              periodKey:
                "2027-03",

              confirmation:
                "CLOSE 2027-03",
            }),
        ).not.toThrow();


        expect(
          () =>
            validateCloseConfirmation({
              periodKey:
                "2027-03",

              confirmation:
                "close 2027-03",
            }),
        ).toThrow(
          /exactly match/i,
        );
      },
    );


    it(
      "requires exact REOPEN confirmation",
      () => {
        expect(
          () =>
            validateReopenConfirmation({
              periodKey:
                "2027-03",

              confirmation:
                "REOPEN 2027-03",
            }),
        ).not.toThrow();
      },
    );


    it(
      "validates persisted status and event actions",
      () => {
        expect(
          parseFinancialPeriodStatus(
            "CLOSED",
          ),
        ).toBe(
          "CLOSED",
        );


        expect(
          parseFinancialPeriodEventAction(
            "REOPENED",
          ),
        ).toBe(
          "REOPENED",
        );
      },
    );
  },
);
