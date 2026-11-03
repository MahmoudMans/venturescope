import { describe, expect, it } from "vitest";

import {
  buildRevenueTrajectoryText,
  buildScenarioComparisonText,
  type RevenueTrajectoryPoint,
  spokenUnit,
} from "@/lib/charts/chart-text";
import type { ScenarioComparisonItem } from "@/lib/finance/types";

function item(
  scenarioName: string,
  firstYearRevenue: string,
  firstYearEbitda: string,
  endingCash: string,
): ScenarioComparisonItem {
  return { scenarioName, firstYearRevenue, firstYearEbitda, endingCash } as ScenarioComparisonItem;
}

const THREE = [
  item("Base Case", "1200000", "-45000", "380000"),
  item("Bull Case", "1800000.4", "210000", "1250000"),
  item("Bear Case", "800000", "-310000", "-20000"),
];

describe("the words for the scenario comparison chart", () => {
  it("describes a chart with several scenarios", () => {
    const text = buildScenarioComparisonText(THREE, "USD");

    expect(text.label).toBe(
      "Bar chart comparing 3 scenarios by first-year revenue, first-year EBITDA and ending cash. The same numbers are in the table that follows.",
    );
  });

  it("says scenario and not scenarios for one scenario", () => {
    const text = buildScenarioComparisonText([THREE[0]], "USD");

    expect(text.label).toContain("comparing 1 scenario by");

    expect(text.label).not.toContain("1 scenarios");
  });

  it("says that there is nothing to compare when the list is empty", () => {
    const text = buildScenarioComparisonText([], "USD");

    expect(text.label).toBe("Bar chart of scenarios. There are no scenarios to compare.");

    expect(text.table.rows).toEqual([]);

    expect(text.table.columns).toHaveLength(4);
  });

  it("names the table and its columns", () => {
    const { table } = buildScenarioComparisonText(THREE, "USD");

    expect(table.caption).toBe(
      "First-year revenue, first-year EBITDA and ending cash of each scenario",
    );

    expect(table.columns).toEqual([
      "Scenario",
      "First-year revenue",
      "First-year EBITDA",
      "Ending cash",
    ]);
  });

  it("has one row for each scenario, in the same order", () => {
    const { table } = buildScenarioComparisonText(THREE, "USD");

    expect(table.rows.map((row) => row[0])).toEqual(["Base Case", "Bull Case", "Bear Case"]);
  });

  it("keeps every scenario when there are many", () => {
    const many = Array.from({ length: 8 }, (_, index) =>
      item(`Case ${index + 1}`, "1000", "100", "500"),
    );

    const { table } = buildScenarioComparisonText(many, "USD");

    expect(table.rows).toHaveLength(8);

    expect(table.rows[7][0]).toBe("Case 8");
  });

  it("writes the numbers as money in the columns where they belong", () => {
    const { table } = buildScenarioComparisonText(THREE, "USD");

    expect(table.rows[0]).toEqual(["Base Case", "$1,200,000", "-$45,000", "$380,000"]);

    expect(table.rows[1]).toEqual(["Bull Case", "$1,800,000", "$210,000", "$1,250,000"]);

    expect(table.rows[2]).toEqual(["Bear Case", "$800,000", "-$310,000", "-$20,000"]);
  });

  it("gives every row one cell for each column", () => {
    const { table } = buildScenarioComparisonText(THREE, "USD");

    for (const row of table.rows) {
      expect(row).toHaveLength(table.columns.length);
    }
  });

  it("uses the currency of the model", () => {
    const { table } = buildScenarioComparisonText([THREE[0]], "EUR");

    expect(table.rows[0]).toEqual([
      "Base Case",
      "\u20ac1,200,000",
      "-\u20ac45,000",
      "\u20ac380,000",
    ]);
  });

  it("keeps the name of a scenario as it was typed", () => {
    const { table } = buildScenarioComparisonText(
      [item('Plan B & "slow" growth', "10", "0", "5")],
      "USD",
    );

    expect(table.rows[0][0]).toBe('Plan B & "slow" growth');
  });

  it("does not change the list it is given", () => {
    const copy = THREE.map((entry) => ({ ...entry }));

    buildScenarioComparisonText(THREE, "USD");

    expect(THREE).toEqual(copy);
  });
});

function points(count: number): RevenueTrajectoryPoint[] {
  return Array.from({ length: count }, (_, index) => ({
    label: `Month ${index + 1}`,
    baseRevenue: 10000 + index * 1000,
    simulatedRevenue: 12000 + index * 1500,
  }));
}

describe("the spoken unit of a slider", () => {
  it("says percent for the percent sign", () => {
    expect(spokenUnit("%")).toBe("percent");
  });

  it("says percentage points for pp", () => {
    expect(spokenUnit("pp")).toBe("percentage points");
  });

  it("gives any other sign back as it is", () => {
    expect(spokenUnit("x")).toBe("x");

    expect(spokenUnit("months")).toBe("months");

    expect(spokenUnit("")).toBe("");
  });

  it("does not change a sign that only looks like a known one", () => {
    expect(spokenUnit("%%")).toBe("%%");

    expect(spokenUnit("PP")).toBe("PP");

    expect(spokenUnit(" pp")).toBe(" pp");
  });
});

describe("the words for the revenue trajectory chart", () => {
  it("describes a chart with 24 months", () => {
    const text = buildRevenueTrajectoryText(points(24), "USD");

    expect(text.label).toBe(
      "Line chart of monthly revenue for the first 24 forecast months: the Base Case compared with the live simulation. The same numbers are in the table that follows.",
    );
  });

  it("says month and not months for one month", () => {
    const text = buildRevenueTrajectoryText(points(1), "USD");

    expect(text.label).toContain("for the first 1 forecast month:");
  });

  it("says that there is nothing to show when there are no months", () => {
    const text = buildRevenueTrajectoryText([], "USD");

    expect(text.label).toBe("Line chart of monthly revenue. There are no forecast months to show.");

    expect(text.table.rows).toEqual([]);
  });

  it("names the table and its columns", () => {
    const { table } = buildRevenueTrajectoryText(points(2), "USD");

    expect(table.caption).toBe("Monthly revenue of the Base Case and of the live simulation");

    expect(table.columns).toEqual(["Month", "Base Case", "Live Simulation"]);
  });

  it("has one row for each month with the base value before the simulated value", () => {
    const { table } = buildRevenueTrajectoryText(points(3), "USD");

    expect(table.rows).toEqual([
      ["Month 1", "$10,000", "$12,000"],
      ["Month 2", "$11,000", "$13,500"],
      ["Month 3", "$12,000", "$15,000"],
    ]);
  });

  it("keeps all 24 months of the chart in the table", () => {
    const { table } = buildRevenueTrajectoryText(points(24), "USD");

    expect(table.rows).toHaveLength(24);

    expect(table.rows[0][0]).toBe("Month 1");

    expect(table.rows[23][0]).toBe("Month 24");
  });

  it("uses the currency of the model", () => {
    const { table } = buildRevenueTrajectoryText(points(1), "GBP");

    expect(table.rows[0]).toEqual(["Month 1", "\u00a310,000", "\u00a312,000"]);
  });

  it("writes a big number with all its digits and not in short form", () => {
    const { table } = buildRevenueTrajectoryText(
      [{ label: "Dec 2027", baseRevenue: 12345678, simulatedRevenue: 987654321 }],
      "USD",
    );

    expect(table.rows[0]).toEqual(["Dec 2027", "$12,345,678", "$987,654,321"]);
  });

  it("keeps a simulation that is lower than the base case in its own column", () => {
    const { table } = buildRevenueTrajectoryText(
      [{ label: "Jan 2027", baseRevenue: 5000, simulatedRevenue: 3000 }],
      "USD",
    );

    expect(table.rows[0][1]).toBe("$5,000");

    expect(table.rows[0][2]).toBe("$3,000");
  });
});
