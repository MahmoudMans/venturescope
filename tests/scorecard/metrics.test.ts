import {
  describe,
  expect,
  it,
} from "vitest";

import {
  parseKpiMetricCode,
  parseKpiTargetPeriod,
  parseKpiTargetValue,
  targetValueForInput,
} from "@/lib/finance/scorecard/metrics";


describe(
  "KPI target metrics",
  () => {
    it(
      "validates KPI codes",
      () => {
        expect(
          parseKpiMetricCode(
            "REVENUE",
          ),
        ).toBe(
          "REVENUE",
        );


        expect(
          () =>
            parseKpiMetricCode(
              "INVALID",
            ),
        ).toThrow(
          /KPI metric/i,
        );
      },
    );


    it(
      "normalizes percentage targets",
      () => {
        expect(
          parseKpiTargetValue(
            "EBITDA_MARGIN",
            "20",
          ),
        ).toBeCloseTo(
          0.20,
        );


        expect(
          parseKpiTargetValue(
            "FORECAST_ACCURACY",
            "92",
          ),
        ).toBeCloseTo(
          0.92,
        );
      },
    );


    it(
      "converts percentage targets back to form values",
      () => {
        expect(
          targetValueForInput({
            metric:
              "FORECAST_ACCURACY",

            value:
              0.90,
          }),
        ).toBe(
          90,
        );
      },
    );


    it(
      "validates whole-number customer targets",
      () => {
        expect(
          parseKpiTargetValue(
            "CUSTOMERS",
            "250",
          ),
        ).toBe(
          250,
        );


        expect(
          () =>
            parseKpiTargetValue(
              "CUSTOMERS",
              "10.5",
            ),
        ).toThrow(
          /whole number/i,
        );
      },
    );


    it(
      "normalizes target periods",
      () => {
        expect(
          parseKpiTargetPeriod(
            "Jan 2027",
          ),
        ).toBe(
          "2027-01",
        );
      },
    );
  },
);
