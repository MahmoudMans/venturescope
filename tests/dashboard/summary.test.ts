import { describe, expect, it } from "vitest";

import { buildDashboardSummary, runwayTone, type DashboardModel } from "@/lib/dashboard/summary";
import { formatCompactCurrencyValue } from "@/lib/finance/formatting";
import type { RunwayResult } from "@/lib/finance/types";

function exhausted(months: number): RunwayResult {
  return {
    status: "EXHAUSTED",

    months,

    exhaustedMonth: "2027-01",

    horizonMonths: 36,
  };
}

const beyondHorizon: RunwayResult = {
  status: "BEYOND_HORIZON",

  months: null,

  exhaustedMonth: null,

  horizonMonths: 36,
};

const cashFlowPositive: RunwayResult = {
  status: "CASH_FLOW_POSITIVE",

  months: null,

  exhaustedMonth: null,

  horizonMonths: 36,
};

function readyModel(
  id: string,
  runway: RunwayResult,
  options: {
    currency?: string;
    revenue?: number;
    scenarioCount?: number;
  } = {},
): DashboardModel {
  return {
    id,

    name: `Model ${id}`,

    industry: null,

    currency: options.currency ?? "EUR",

    startMonth: new Date("2027-01-01T00:00:00.000Z"),

    horizonMonths: 36,

    revenueMode: "DIRECT",

    updatedAt: new Date("2027-01-01T00:00:00.000Z"),

    scenarioCount: options.scenarioCount ?? 3,

    status: "READY",

    completedSections: 3,

    snapshot: null,

    metrics: {
      firstYearRevenue: options.revenue ?? 1_000_000,

      runway,
    },
  };
}

function setupModel(id: string, completedSections: number): DashboardModel {
  return {
    ...readyModel(id, beyondHorizon),

    status: "SETUP_REQUIRED",

    completedSections,

    metrics: null,
  };
}

describe("dashboard summary", () => {
  it("shows neutral placeholders when no model has a forecast", () => {
    const summary = buildDashboardSummary([setupModel("a", 1)]);

    expect(summary.modelCount).toBe(1);

    expect(summary.forecastReady).toBe(0);

    expect(summary.revenueLabel).toBe("—");

    expect(summary.runwayLabel).toBe("—");
  });

  it("reports the median runway across ready models", () => {
    const summary = buildDashboardSummary([
      readyModel("a", exhausted(6)),

      readyModel("b", exhausted(10)),

      readyModel("c", exhausted(20)),
    ]);

    expect(summary.runwayLabel).toBe("10 mo");
  });

  it("averages the two middle values and rounds", () => {
    const summary = buildDashboardSummary([
      readyModel("a", exhausted(6)),

      readyModel("b", exhausted(9)),
    ]);

    expect(summary.runwayLabel).toBe("8 mo");
  });

  it("marks a capped runway as beyond the horizon", () => {
    const summary = buildDashboardSummary([readyModel("a", beyondHorizon)]);

    expect(summary.runwayLabel).toBe(">36 mo");
  });

  it("calls the portfolio self-funding when every model is cash-flow positive", () => {
    const summary = buildDashboardSummary([
      readyModel("a", cashFlowPositive),

      readyModel("b", cashFlowPositive),
    ]);

    expect(summary.runwayLabel).toBe("Self-funding");
  });

  it("keeps currencies separate instead of adding them together", () => {
    const summary = buildDashboardSummary([
      readyModel("a", beyondHorizon, {
        currency: "EUR",

        revenue: 2_000_000,
      }),

      readyModel("b", beyondHorizon, {
        currency: "EUR",

        revenue: 1_000_000,
      }),

      readyModel("c", beyondHorizon, {
        currency: "USD",

        revenue: 500_000,
      }),
    ]);

    expect(summary.revenueLabel).toBe(
      `${formatCompactCurrencyValue(3_000_000, "EUR")} · ${formatCompactCurrencyValue(
        500_000,
        "USD",
      )}`,
    );
  });

  it("counts models with three scenarios as scenario-ready", () => {
    const summary = buildDashboardSummary([
      readyModel("a", beyondHorizon, {
        scenarioCount: 3,
      }),

      readyModel("b", beyondHorizon, {
        scenarioCount: 1,
      }),
    ]);

    expect(summary.scenarioReady).toBe(1);
  });

  it("lists the most urgent models first and skips healthy ones", () => {
    const summary = buildDashboardSummary([
      setupModel("setup", 2),

      readyModel("healthy", beyondHorizon),

      readyModel("watch", exhausted(11)),

      readyModel("critical", exhausted(4)),
    ]);

    expect(summary.attention.map((item) => item.severity)).toEqual(["danger", "warning", "info"]);

    expect(summary.attention[0].href).toBe("/projects/critical/risk-center");

    expect(summary.attention[2].href).toBe("/projects/setup/assumptions");
  });

  it("limits the attention list to five items", () => {
    const summary = buildDashboardSummary(
      Array.from(
        {
          length: 8,
        },
        (_, index) => setupModel(`m${index}`, 0),
      ),
    );

    expect(summary.attention).toHaveLength(5);
  });
});

describe("runwayTone", () => {
  it("treats short runways as danger and mid-range runways as a warning", () => {
    expect(runwayTone(exhausted(6))).toBe("danger");

    expect(runwayTone(exhausted(12))).toBe("warning");

    expect(runwayTone(exhausted(13))).toBe("good");

    expect(runwayTone(beyondHorizon)).toBe("good");
  });
});
