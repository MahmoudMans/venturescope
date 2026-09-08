import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildOrbitAnalyticsDemoForecast,
  buildOrbitAnalyticsScenarioComparison,
  ORBIT_ANALYTICS_SCENARIOS,
} from "@/lib/demo/orbit-analytics";

describe(
  "Orbit Analytics portfolio demo",
  () => {
    it(
      "contains exactly Base, Bull and Bear scenarios",
      () => {
        expect(
          ORBIT_ANALYTICS_SCENARIOS.map(
            (
              scenario,
            ) =>
              scenario.type,
          ),
        ).toEqual([
          "BASE",
          "BULL",
          "BEAR",
        ]);
      },
    );

    it(
      "generates a deterministic 36-month Base forecast",
      () => {
        const first =
          buildOrbitAnalyticsDemoForecast(
            "demo-base",
          );

        const second =
          buildOrbitAnalyticsDemoForecast(
            "demo-base",
          );

        expect(
          first.months,
        ).toHaveLength(
          36,
        );

        expect(
          second.metrics,
        ).toEqual(
          first.metrics,
        );

        expect(
          second.annual,
        ).toEqual(
          first.annual,
        );
      },
    );

    it(
      "produces three scenario comparison results",
      () => {
        expect(
          buildOrbitAnalyticsScenarioComparison(),
        ).toHaveLength(
          3,
        );
      },
    );

    it(
      "keeps Bull revenue above Bear revenue for the sample model",
      () => {
        const comparison =
          buildOrbitAnalyticsScenarioComparison();

        const bull =
          comparison.find(
            (
              item,
            ) =>
              item.scenarioType ===
              "BULL",
          );

        const bear =
          comparison.find(
            (
              item,
            ) =>
              item.scenarioType ===
              "BEAR",
          );

        expect(
          bull,
        ).toBeDefined();

        expect(
          bear,
        ).toBeDefined();

        expect(
          Number(
            bull!.firstYearRevenue,
          ),
        ).toBeGreaterThan(
          Number(
            bear!.firstYearRevenue,
          ),
        );
      },
    );
  },
);
