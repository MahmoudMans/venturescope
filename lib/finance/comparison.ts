import {
  generateFinancialForecast,
} from "@/lib/finance/engine";
import type {
  FinancialModelInput,
  FinancialScenarioInput,
  ScenarioComparisonItem,
} from "@/lib/finance/types";

export function generateScenarioComparison(
  baseInput: FinancialModelInput,
  scenarios: FinancialScenarioInput[],
): ScenarioComparisonItem[] {
  return scenarios.map(
    (
      scenario,
    ) => {
      const forecast =
        generateFinancialForecast({
          ...baseInput,
          scenario,
        });

      return {
        scenarioId:
          scenario.id,

        scenarioName:
          scenario.name,

        scenarioType:
          scenario.type,

        firstYearRevenue:
          forecast.metrics
            .firstYearRevenue,

        firstYearEbitda:
          forecast.metrics
            .firstYearEbitda,

        endingCash:
          forecast.metrics
            .endingCash,

        endingMrr:
          forecast.metrics
            .endingMrr,

        endingCustomers:
          forecast.metrics
            .endingCustomers,

        runway:
          forecast.metrics
            .runway,

        firstEbitdaBreakEvenMonth:
          forecast.metrics
            .breakEven
            .firstEbitdaBreakEvenMonth,

        sustainedBreakEvenMonth:
          forecast.metrics
            .breakEven
            .sustainedBreakEvenMonth,
      };
    },
  );
}
