import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildSensitivityAxis,
} from "@/lib/finance/sensitivity-lab/calculations";


describe(
  "sensitivity axis",
  () => {
    it(
      "creates evenly spaced five-point axis",
      () => {
        expect(
          buildSensitivityAxis(
            0.40,
            5,
          ),
        ).toEqual([
          0,
          0.10,
          0.20,
          0.30,
          0.40,
        ]);
      },
    );


    it(
      "supports seven-point grids",
      () => {
        const axis =
          buildSensitivityAxis(
            0.60,
            7,
          );


        expect(
          axis,
        ).toHaveLength(
          7,
        );


        expect(
          axis[
            0
          ],
        ).toBe(
          0,
        );


        expect(
          axis[
            6
          ],
        ).toBeCloseTo(
          0.60,
        );
      },
    );


    it(
      "rejects oversized grids",
      () => {
        expect(
          () =>
            buildSensitivityAxis(
              0.40,
              8,
            ),
        ).toThrow(
          /between 2 and 7/i,
        );
      },
    );
  },
);
