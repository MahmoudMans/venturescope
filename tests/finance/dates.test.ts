import {
  describe,
  expect,
  it,
} from "vitest";

import {
  addMonths,
  compareMonths,
  enumerateMonths,
  monthDistance,
  monthKeyToSerial,
  serialToMonthKey,
} from "@/lib/finance/dates";

describe(
  "financial month utilities",
  () => {
    it(
      "crosses calendar years deterministically",
      () => {
        expect(
          addMonths(
            "2027-12",
            1,
          ),
        ).toBe(
          "2028-01",
        );

        expect(
          addMonths(
            "2027-01",
            24,
          ),
        ).toBe(
          "2029-01",
        );
      },
    );

    it(
      "supports negative month offsets",
      () => {
        expect(
          addMonths(
            "2027-01",
            -1,
          ),
        ).toBe(
          "2026-12",
        );
      },
    );

    it(
      "enumerates an exact forecast horizon",
      () => {
        const months =
          enumerateMonths(
            "2027-11",
            4,
          );

        expect(
          months,
        ).toEqual([
          "2027-11",
          "2027-12",
          "2028-01",
          "2028-02",
        ]);
      },
    );

    it(
      "calculates month distances",
      () => {
        expect(
          monthDistance(
            "2027-01",
            "2028-01",
          ),
        ).toBe(
          12,
        );

        expect(
          monthDistance(
            "2028-01",
            "2027-01",
          ),
        ).toBe(
          -12,
        );
      },
    );

    it(
      "round-trips serial months",
      () => {
        const serial =
          monthKeyToSerial(
            "2031-07",
          );

        expect(
          serialToMonthKey(
            serial,
          ),
        ).toBe(
          "2031-07",
        );
      },
    );

    it(
      "compares chronological months",
      () => {
        expect(
          compareMonths(
            "2027-01",
            "2027-02",
          ),
        ).toBeLessThan(
          0,
        );

        expect(
          compareMonths(
            "2027-02",
            "2027-02",
          ),
        ).toBe(
          0,
        );
      },
    );
  },
);
