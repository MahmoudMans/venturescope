import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateAccuracyStatistics,
  classifyBias,
  classifyTrend,
  forecastObservation,
} from "@/lib/finance/forecast-accuracy/calculations";


describe(
  "forecast accuracy mathematics",
  () => {
    it(
      "calculates WAPE and accuracy",
      () => {
        const statistics =
          calculateAccuracyStatistics([
            forecastObservation(
              "2027-01",
              100,
              110,
            ),

            forecastObservation(
              "2027-02",
              200,
              180,
            ),
          ]);


        expect(
          statistics.absoluteError,
        ).toBe(
          30,
        );


        expect(
          statistics.wape,
        ).toBeCloseTo(
          0.1,
        );


        expect(
          statistics.accuracyScore,
        ).toBeCloseTo(
          0.9,
        );
      },
    );


    it(
      "uses forecast minus actual as signed bias",
      () => {
        const statistics =
          calculateAccuracyStatistics([
            forecastObservation(
              "2027-01",
              100,
              120,
            ),

            forecastObservation(
              "2027-02",
              100,
              120,
            ),
          ]);


        expect(
          statistics.signedError,
        ).toBe(
          40,
        );


        expect(
          classifyBias(
            statistics,
          ),
        ).toBe(
          "OVER_FORECASTING",
        );
      },
    );


    it(
      "classifies persistent under-forecasting",
      () => {
        const statistics =
          calculateAccuracyStatistics([
            forecastObservation(
              "2027-01",
              100,
              80,
            ),

            forecastObservation(
              "2027-02",
              100,
              80,
            ),
          ]);


        expect(
          classifyBias(
            statistics,
          ),
        ).toBe(
          "UNDER_FORECASTING",
        );
      },
    );


    it(
      "detects improving forecast accuracy",
      () => {
        const observations = [
          forecastObservation(
            "2027-01",
            100,
            140,
          ),

          forecastObservation(
            "2027-02",
            100,
            140,
          ),

          forecastObservation(
            "2027-03",
            100,
            140,
          ),

          forecastObservation(
            "2027-04",
            100,
            105,
          ),

          forecastObservation(
            "2027-05",
            100,
            105,
          ),

          forecastObservation(
            "2027-06",
            100,
            105,
          ),
        ];


        expect(
          classifyTrend(
            observations,
          ),
        ).toBe(
          "IMPROVING",
        );
      },
    );
  },
);
