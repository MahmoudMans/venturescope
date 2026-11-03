import { generateFinancialForecast } from "@/lib/finance/engine";
import { buildFinancialModelInput } from "@/lib/finance/project-input";
import type { ModelBackupModel } from "@/lib/projects/model-backup";
import { monthInputToUtcDate } from "@/lib/projects/project-dates";

/**
 * Runs the forecast for every scenario of a backup before anything is saved.
 * It returns a message when a scenario cannot be calculated, or null when all
 * of them can. A backup that cannot be calculated would give the person a model
 * whose pages all fail, so it is refused up front instead.
 */
export function findBackupCalculationProblem(model: ModelBackupModel): string | null {
  const scenarios = model.scenarios.map((scenario, index) => ({
    id: `scenario-${index}`,

    name: scenario.name,

    type: scenario.type,

    modifiers: scenario.modifiers,
  }));

  const scenarioIds = new Map(
    scenarios.map((scenario): [string, string] => [scenario.name, scenario.id]),
  );

  const source = {
    id: "backup",

    name: model.name,

    currency: model.currency,

    startMonth: monthInputToUtcDate(model.startMonth),

    horizonMonths: model.horizonMonths,

    revenueMode: model.revenueMode,

    modelVersion: "1.0",

    baseAssumptions: model.assumptions,

    financingEvents: model.financingEvents.map((event) => ({
      name: event.name,

      type: event.type,

      month: monthInputToUtcDate(event.month),

      amount: event.amount,

      apr: event.apr,

      termMonths: event.termMonths,

      repaymentStartMonth: event.repaymentStartMonth
        ? monthInputToUtcDate(event.repaymentStartMonth)
        : null,
    })),

    monthlyOverrides: model.overrides.map((override) => ({
      scenarioId: override.scenario === null ? null : (scenarioIds.get(override.scenario) ?? null),

      month: monthInputToUtcDate(override.month),

      values: override.values,

      note: override.note,
    })),
  };

  for (const scenario of scenarios) {
    try {
      const forecast = generateFinancialForecast(buildFinancialModelInput(source, scenario));

      if (forecast.months.length !== model.horizonMonths) {
        return `The "${scenario.name}" scenario of this backup did not produce a full forecast.`;
      }
    } catch {
      return `The "${scenario.name}" scenario of this backup could not be calculated.`;
    }
  }

  return null;
}
