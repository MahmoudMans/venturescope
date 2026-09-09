import {
  describe,
  expect,
  it,
} from "vitest";

import {
  formatMonthKey,
  parseMonthKey,
  parseMonthStartUtc,
} from "@/lib/finance/actuals/month";


describe(
  "timezone-independent month normalization",
  () => {
    it.each([
      [
        "Jan 2027",
        "2027-01",
      ],

      [
        "January 2027",
        "2027-01",
      ],

      [
        "2027 Jan",
        "2027-01",
      ],

      [
        "2027 January",
        "2027-01",
      ],

      [
        "2027-01",
        "2027-01",
      ],

      [
        "2027/01",
        "2027-01",
      ],

      [
        "01/2027",
        "2027-01",
      ],

      [
        "2027-01-31",
        "2027-01",
      ],
    ])(
      "normalizes %s",
      (
        input,
        expected,
      ) => {
        expect(
          parseMonthKey(
            input,
          ),
        ).toBe(
          expected,
        );
      },
    );


    it(
      "creates month starts explicitly in UTC",
      () => {
        expect(
          parseMonthStartUtc(
            "Jan 2027",
          )?.toISOString(),
        ).toBe(
          "2027-01-01T00:00:00.000Z",
        );
      },
    );


    it(
      "round-trips UTC month keys",
      () => {
        const date =
          parseMonthStartUtc(
            "Jan 2027",
          );


        expect(
          date
            ?
              formatMonthKey(
                date,
              )
            :
              null,
        ).toBe(
          "2027-01",
        );
      },
    );


    it(
      "rejects invalid months deterministically",
      () => {
        expect(
          parseMonthKey(
            "2027-13",
          ),
        ).toBeNull();


        expect(
          parseMonthKey(
            "NotAMonth 2027",
          ),
        ).toBeNull();
      },
    );
  },
);
