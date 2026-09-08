import {
  dateToMonthKey,
} from "@/lib/finance/dates";
import {
  parseMonthlyOverrideValues,
} from "@/lib/finance/override-engine";
import type {
  MonthlyOverrideValues,
  RevenueMode,
} from "@/lib/finance/types";

export type MonthlyOverrideViewModel = {
  id: string;

  month: string;

  scenarioId: string | null;

  scenarioName: string;

  values: MonthlyOverrideValues;

  note: string | null;
};

export type OverrideProjectMode =
  RevenueMode;

export function serializeMonthlyOverride(
  override: {
    id: string;

    month: Date;

    scenarioId:
      | string
      | null;

    values: unknown;

    note:
      | string
      | null;
  },
  scenarioName: string,
): MonthlyOverrideViewModel {
  return {
    id:
      override.id,

    month:
      dateToMonthKey(
        override.month,
      ),

    scenarioId:
      override.scenarioId,

    scenarioName,

    values:
      parseMonthlyOverrideValues(
        override.values,
      ),

    note:
      override.note,
  };
}
