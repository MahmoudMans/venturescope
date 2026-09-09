import {
  describe,
  expect,
  it,
} from "vitest";

import {
  firstPreRaiseFloorBreach,
  minimumCapitalRequired,
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
      -100,
  },

  {
    period:
      "2027-03",

    cashBalance:
      -300,
  },
];


describe(
  "capital funding gap",
  () => {
    it(
      "calculates capital needed to protect the target floor",
      () => {
        expect(
          minimumCapitalRequired({
            path,

            targetCashFloor:
              0,

            raisePeriodIndex:
              0,
          }),
        ).toBe(
          300,
        );
      },
    );


    it(
      "includes management cash-floor protection",
      () => {
        expect(
          minimumCapitalRequired({
            path,

            targetCashFloor:
              200,

            raisePeriodIndex:
              0,
          }),
        ).toBe(
          500,
        );
      },
    );


    it(
      "detects when a selected raise is already too late",
      () => {
        expect(
          firstPreRaiseFloorBreach({
            path,

            targetCashFloor:
              0,

            raisePeriodIndex:
              2,
          }),
        ).toBe(
          "2027-02",
        );
      },
    );
  },
);
