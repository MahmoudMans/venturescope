import { describe, expect, it } from "vitest";

import { filterAndSortModels } from "@/lib/dashboard/model-list";
import type { DashboardModel } from "@/lib/dashboard/summary";
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

function model(
  id: string,
  name: string,
  options: {
    runway?: RunwayResult;
    status?: DashboardModel["status"];
    industry?: string | null;
    updatedAt?: string;
  } = {},
): DashboardModel {
  const status = options.status ?? "READY";

  return {
    id,

    name,

    industry: options.industry ?? null,

    currency: "EUR",

    startMonth: new Date("2027-01-01T00:00:00.000Z"),

    horizonMonths: 36,

    revenueMode: "DIRECT",

    updatedAt: new Date(options.updatedAt ?? "2027-01-01T00:00:00.000Z"),

    scenarioCount: 3,

    status,

    completedSections: status === "READY" ? 3 : 1,

    snapshot: null,

    metrics:
      status === "READY"
        ? {
            firstYearRevenue: 1_000_000,

            runway: options.runway ?? beyondHorizon,
          }
        : null,
  };
}

const all = (models: DashboardModel[]) =>
  filterAndSortModels(models, {
    query: "",

    sort: "updated",

    status: "all",
  }).map((item) => item.id);

describe("filterAndSortModels", () => {
  const models = [
    model("a", "Acme Analytics", {
      industry: "B2B SaaS",

      runway: exhausted(20),

      updatedAt: "2027-01-02T00:00:00.000Z",
    }),

    model("b", "bright Labs", {
      runway: exhausted(4),

      updatedAt: "2027-01-05T00:00:00.000Z",
    }),

    model("c", "Cobalt", {
      status: "SETUP_REQUIRED",

      updatedAt: "2027-01-03T00:00:00.000Z",
    }),

    model("d", "Delta Retail", {
      industry: "Retail",

      runway: beyondHorizon,

      updatedAt: "2027-01-04T00:00:00.000Z",
    }),
  ];

  it("sorts by most recently updated by default", () => {
    expect(all(models)).toEqual(["b", "d", "c", "a"]);
  });

  it("sorts by name without caring about case", () => {
    const result = filterAndSortModels(models, {
      query: "",

      sort: "name",

      status: "all",
    });

    expect(result.map((item) => item.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("puts the shortest runway first and models without a forecast last", () => {
    const result = filterAndSortModels(models, {
      query: "",

      sort: "runway",

      status: "all",
    });

    expect(result.map((item) => item.id)).toEqual(["b", "a", "d", "c"]);
  });

  it("searches name and industry", () => {
    const byName = filterAndSortModels(models, {
      query: "  ACME ",

      sort: "name",

      status: "all",
    });

    expect(byName.map((item) => item.id)).toEqual(["a"]);

    const byIndustry = filterAndSortModels(models, {
      query: "retail",

      sort: "name",

      status: "all",
    });

    expect(byIndustry.map((item) => item.id)).toEqual(["d"]);
  });

  it("filters by forecast status", () => {
    const ready = filterAndSortModels(models, {
      query: "",

      sort: "name",

      status: "ready",
    });

    expect(ready.map((item) => item.id)).toEqual(["a", "b", "d"]);

    const setup = filterAndSortModels(models, {
      query: "",

      sort: "name",

      status: "setup",
    });

    expect(setup.map((item) => item.id)).toEqual(["c"]);
  });

  it("does not change the list it receives", () => {
    const before = models.map((item) => item.id);

    filterAndSortModels(models, {
      query: "",

      sort: "name",

      status: "all",
    });

    expect(models.map((item) => item.id)).toEqual(before);
  });
});
