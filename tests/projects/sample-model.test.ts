import { describe, expect, it } from "vitest";

import { parseStoredFinancialAssumptions } from "@/lib/finance/assumptions/storage";
import { addMonths, compareMonths } from "@/lib/finance/dates";
import { generateFinancialForecast } from "@/lib/finance/engine";
import { buildFinancialModelInput } from "@/lib/finance/project-input";
import { SAMPLE_MODEL_NAME, buildSampleModel, getSampleNotice } from "@/lib/projects/sample-model";
import { DEFAULT_PROJECT_SCENARIOS } from "@/lib/projects/scenario-defaults";

const START = "2026-10";

describe("buildSampleModel", () => {
  const sample = buildSampleModel(START);

  it("describes a complete customer-driven model that starts in the month asked for", () => {
    expect(sample.name).toBe(SAMPLE_MODEL_NAME);

    expect(sample.startMonth).toBe(START);

    expect(sample.revenueMode).toBe("CUSTOMER_DRIVEN");

    expect(sample.horizonMonths).toBe(36);

    expect(sample.assumptions.completion).toEqual({
      general: true,
      revenue: true,
      expenses: true,
    });
  });

  it("stores assumptions that the app accepts when it reads them back", () => {
    const stored = JSON.parse(JSON.stringify(sample.assumptions));

    expect(parseStoredFinancialAssumptions(stored)).toEqual(sample.assumptions);
  });

  it("moves every financing event and override into the new window", () => {
    const last = addMonths(START, sample.horizonMonths - 1);

    for (const event of sample.financingEvents) {
      expect(compareMonths(event.month, START)).toBeGreaterThanOrEqual(0);

      expect(compareMonths(event.month, last)).toBeLessThanOrEqual(0);
    }

    for (const override of sample.overrides) {
      expect(compareMonths(override.month, START)).toBeGreaterThanOrEqual(0);

      expect(compareMonths(override.month, last)).toBeLessThanOrEqual(0);
    }
  });

  it("keeps the gaps between months the same as in the public demo", () => {
    expect(sample.financingEvents.map((event) => event.month)).toEqual([
      addMonths(START, 5),
      addMonths(START, 9),
      addMonths(START, 15),
    ]);

    const debt = sample.financingEvents.find((event) => event.type === "DEBT");

    expect(debt?.repaymentStartMonth).toBe(addMonths(START, 21));

    expect(debt?.termMonths).toBe(36);

    expect(debt?.apr).toBe("7.5");
  });

  it("only gives interest terms to the loan", () => {
    for (const event of sample.financingEvents) {
      if (event.type !== "DEBT") {
        expect(event.apr).toBe(null);

        expect(event.termMonths).toBe(null);

        expect(event.repaymentStartMonth).toBe(null);
      }
    }
  });

  it("adds month overrides for every scenario and for the Bull and Bear cases", () => {
    const targets = new Set(sample.overrides.map((override) => override.scenario));

    expect(targets.has("ALL")).toBe(true);

    expect(targets.has("BULL")).toBe(true);

    expect(targets.has("BEAR")).toBe(true);

    expect(sample.overrides.find((override) => override.scenario === "BULL")?.values.arpu).toBe(
      "175",
    );

    expect(sample.overrides.find((override) => override.scenario === "BEAR")?.values.cac).toBe(
      "340",
    );
  });

  it("gives a fresh copy each time, so one call cannot change another", () => {
    const first = buildSampleModel(START);

    first.assumptions.general.startingCash = "1";

    first.financingEvents.length = 0;

    const second = buildSampleModel(START);

    expect(second.assumptions.general.startingCash).toBe("350000");

    expect(second.financingEvents).toHaveLength(3);
  });

  it("produces a forecast for the Base, Bull and Bear scenarios as the database stores them", () => {
    const scenarios = DEFAULT_PROJECT_SCENARIOS.map((scenario, index) => ({
      id: `scenario-${index}`,
      name: scenario.name,
      type: scenario.type,
      modifiers: scenario.modifiers,
    }));

    const source = {
      id: "sample",
      name: sample.name,
      currency: sample.currency,
      startMonth: new Date(Date.UTC(2026, 9, 1)),
      horizonMonths: sample.horizonMonths,
      revenueMode: sample.revenueMode,
      modelVersion: "1.0",
      baseAssumptions: JSON.parse(JSON.stringify(sample.assumptions)),
      financingEvents: sample.financingEvents.map((event) => ({
        name: event.name,
        type: event.type,
        month: new Date(`${event.month}-01T00:00:00Z`),
        amount: event.amount,
        apr: event.apr,
        termMonths: event.termMonths,
        repaymentStartMonth: event.repaymentStartMonth
          ? new Date(`${event.repaymentStartMonth}-01T00:00:00Z`)
          : null,
      })),
      monthlyOverrides: sample.overrides.map((override) => ({
        month: new Date(`${override.month}-01T00:00:00Z`),
        scenarioId:
          override.scenario === "ALL"
            ? null
            : scenarios.find((scenario) => scenario.type === override.scenario)?.id,
        values: override.values,
        note: override.note,
      })),
    };

    const revenue = new Map<string, number>();

    for (const scenario of scenarios) {
      const forecast = generateFinancialForecast(buildFinancialModelInput(source, scenario));

      expect(forecast.months).toHaveLength(36);

      expect(forecast.months[0]?.month).toBe(START);

      revenue.set(scenario.type, Number(forecast.metrics.firstYearRevenue));
    }

    expect(revenue.get("BULL") ?? 0).toBeGreaterThan(revenue.get("BEAR") ?? 0);
  });
});

describe("getSampleNotice", () => {
  it("explains a failed attempt only for the code the action sends", () => {
    expect(getSampleNotice("sample-failed")?.tone).toBe("error");

    expect(getSampleNotice(undefined)).toBe(null);

    expect(getSampleNotice(["sample-failed"])).toBe(null);

    expect(getSampleNotice("other")).toBe(null);
  });
});
