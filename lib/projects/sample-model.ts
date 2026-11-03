import type { FinancialAssumptionsV1 } from "@/lib/finance/assumptions/types";
import { addMonths, monthDistance } from "@/lib/finance/dates";
import type { FinancingType, MonthlyOverrideValues, RevenueMode } from "@/lib/finance/types";
import {
  orbitAnalyticsDemoAssumptions,
  orbitAnalyticsDemoBaseInput,
} from "@/lib/demo/orbit-analytics";

/** The name a person sees on the dashboard. It is also how a second click finds the first copy. */
export const SAMPLE_MODEL_NAME = "Orbit Analytics (sample)";

export const SAMPLE_MODEL_INDUSTRY = "B2B SaaS";

export type SampleFinancingEvent = {
  name: string;

  type: FinancingType;

  month: string;

  amount: string;

  apr: string | null;

  termMonths: number | null;

  repaymentStartMonth: string | null;
};

/** ALL is a month override for every scenario; BULL and BEAR belong to one scenario. */
export type SampleOverrideTarget = "ALL" | "BULL" | "BEAR";

export type SampleOverride = {
  scenario: SampleOverrideTarget;

  month: string;

  values: MonthlyOverrideValues;

  note: string;
};

export type SampleModel = {
  name: string;

  industry: string;

  currency: string;

  /** First forecast month, "YYYY-MM". */
  startMonth: string;

  horizonMonths: number;

  revenueMode: RevenueMode;

  assumptions: FinancialAssumptionsV1;

  financingEvents: SampleFinancingEvent[];

  overrides: SampleOverride[];
};

function overrideTarget(scenarioId: string | null | undefined): SampleOverrideTarget {
  if (scenarioId === "demo-bull") {
    return "BULL";
  }

  if (scenarioId === "demo-bear") {
    return "BEAR";
  }

  return "ALL";
}

/**
 * A complete example model for someone who wants to explore before typing
 * their own numbers. It reuses the Orbit Analytics company from the public
 * demo, moved so that its first month is the month the person asks for.
 */
export function buildSampleModel(startMonth: string): SampleModel {
  const demo = orbitAnalyticsDemoBaseInput();

  const shift = (month: string): string =>
    addMonths(startMonth, monthDistance(demo.startMonth, month));

  return {
    name: SAMPLE_MODEL_NAME,

    industry: SAMPLE_MODEL_INDUSTRY,

    currency: demo.currency,

    startMonth,

    horizonMonths: demo.horizonMonths,

    revenueMode: demo.revenueMode,

    assumptions: orbitAnalyticsDemoAssumptions(),

    financingEvents: (demo.financingEvents ?? []).map((event) => ({
      name: event.name,

      type: event.type,

      month: shift(event.month),

      amount: event.amount,

      apr: event.apr ?? null,

      termMonths: event.termMonths ?? null,

      repaymentStartMonth: event.repaymentStartMonth ? shift(event.repaymentStartMonth) : null,
    })),

    overrides: (demo.monthlyOverrides ?? []).map((override) => ({
      scenario: overrideTarget(override.scenarioId),

      month: shift(override.month),

      values: { ...override.values },

      note: override.note ?? "",
    })),
  };
}

/** The dashboard is opened with "?status=sample-failed" when creating the sample did not work. */
export function getSampleNotice(
  code: string | string[] | undefined,
): { tone: "error"; message: string } | null {
  if (code !== "sample-failed") {
    return null;
  }

  return {
    tone: "error",

    message: "We could not create the sample model. Nothing was saved, so you can try again.",
  };
}
