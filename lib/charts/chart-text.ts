import { formatCurrencyValue } from "@/lib/finance/formatting";
import type { ScenarioComparisonItem } from "@/lib/finance/types";

/** The numbers of a chart as a table, for people who cannot see the chart. */
export type ChartTextTable = {
  /** What the table lists. */
  caption: string;

  /** The first column names each row. The other columns hold the values. */
  columns: string[];

  rows: string[][];
};

export type ChartText = {
  /** A short description of the whole chart. */
  label: string;

  table: ChartTextTable;
};

export type RevenueTrajectoryPoint = {
  label: string;

  baseRevenue: number;

  simulatedRevenue: number;
};

/** How a screen reader should say the sign after a number. "5%" and "5pp" are read badly. */
export function spokenUnit(suffix: string): string {
  if (suffix === "%") {
    return "percent";
  }

  if (suffix === "pp") {
    return "percentage points";
  }

  return suffix;
}

/** The words for a chart that compares scenarios. */
export function buildScenarioComparisonText(
  comparison: ScenarioComparisonItem[],
  currency: string,
): ChartText {
  const count = comparison.length;

  return {
    label:
      count === 0
        ? "Bar chart of scenarios. There are no scenarios to compare."
        : `Bar chart comparing ${count} ${count === 1 ? "scenario" : "scenarios"} by first-year revenue, first-year EBITDA and ending cash. The same numbers are in the table that follows.`,

    table: {
      caption: "First-year revenue, first-year EBITDA and ending cash of each scenario",

      columns: ["Scenario", "First-year revenue", "First-year EBITDA", "Ending cash"],

      rows: comparison.map((item) => [
        item.scenarioName,
        formatCurrencyValue(item.firstYearRevenue, currency),
        formatCurrencyValue(item.firstYearEbitda, currency),
        formatCurrencyValue(item.endingCash, currency),
      ]),
    },
  };
}

/** The words for the chart that compares the Base Case with the live simulation. */
export function buildRevenueTrajectoryText(
  points: RevenueTrajectoryPoint[],
  currency: string,
): ChartText {
  const count = points.length;

  return {
    label:
      count === 0
        ? "Line chart of monthly revenue. There are no forecast months to show."
        : `Line chart of monthly revenue for the first ${count} forecast ${count === 1 ? "month" : "months"}: the Base Case compared with the live simulation. The same numbers are in the table that follows.`,

    table: {
      caption: "Monthly revenue of the Base Case and of the live simulation",

      columns: ["Month", "Base Case", "Live Simulation"],

      rows: points.map((point) => [
        point.label,
        formatCurrencyValue(point.baseRevenue, currency),
        formatCurrencyValue(point.simulatedRevenue, currency),
      ]),
    },
  };
}
