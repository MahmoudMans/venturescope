import type { DashboardSharing } from "@/lib/dashboard/model-sharing-status";
import { formatCompactCurrencyValue, formatRunway } from "@/lib/finance/formatting";
import type { RunwayResult } from "@/lib/finance/types";

export type DashboardModelStatus = "READY" | "SETUP_REQUIRED" | "UNAVAILABLE";

export type DashboardTone = "good" | "warning" | "danger";

export type DashboardModelSnapshot = {
  firstYearRevenueLabel: string;
  endingCashLabel: string;
  runwayLabel: string;
  runwayTone: DashboardTone;
};

export type DashboardModel = {
  id: string;
  name: string;
  industry: string | null;
  currency: string;
  startMonth: Date;
  horizonMonths: number;
  revenueMode: string;
  updatedAt: Date;
  scenarioCount: number;
  status: DashboardModelStatus;
  completedSections: number;
  snapshot: DashboardModelSnapshot | null;

  /** The workspace where the owner shared the model, or nothing when it is private. */
  sharing?: DashboardSharing | null;

  /** Raw values used only to build portfolio-level KPIs. */
  metrics: {
    firstYearRevenue: number;
    runway: RunwayResult;
  } | null;
};

export type DashboardAttentionItem = {
  id: string;
  message: string;
  href: string;
  severity: "danger" | "warning" | "info";
};

export type DashboardSummary = {
  modelCount: number;
  scenarioReady: number;
  forecastReady: number;
  revenueLabel: string;
  revenueDetail: string;
  runwayLabel: string;
  runwayDetail: string;
  attention: DashboardAttentionItem[];
};

export const ASSUMPTION_SECTION_COUNT = 3;

const MAX_ATTENTION_ITEMS = 5;

function plural(count: number, singular: string): string {
  return count === 1 ? singular : `${singular}s`;
}

export function runwayTone(runway: RunwayResult): DashboardTone {
  switch (runway.status) {
    case "ZERO":
      return "danger";

    case "EXHAUSTED": {
      const months = runway.months ?? 0;

      if (months <= 6) {
        return "danger";
      }

      return months <= 12 ? "warning" : "good";
    }

    case "BEYOND_HORIZON":
    case "CASH_FLOW_POSITIVE":
      return "good";
  }
}

type RunwayPoint = {
  months: number;
  capped: boolean;
};

function runwayPoint(runway: RunwayResult): RunwayPoint | null {
  switch (runway.status) {
    case "ZERO":
      return {
        months: 0,
        capped: false,
      };

    case "EXHAUSTED":
      return {
        months: runway.months ?? 0,
        capped: false,
      };

    case "BEYOND_HORIZON":
      return {
        months: runway.horizonMonths,
        capped: true,
      };

    case "CASH_FLOW_POSITIVE":
      return null;
  }
}

function medianRunway(points: RunwayPoint[]): RunwayPoint {
  const sorted = [...points].sort((left, right) => left.months - right.months);

  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return sorted[middle];
  }

  const low = sorted[middle - 1];

  const high = sorted[middle];

  return {
    months: Math.round((low.months + high.months) / 2),

    capped: low.capped || high.capped,
  };
}

const severityOrder = {
  danger: 0,
  warning: 1,
  info: 2,
} as const;

export function buildDashboardSummary(models: DashboardModel[]): DashboardSummary {
  const ready = models.filter((model) => model.status === "READY" && model.metrics);

  const revenueByCurrency = new Map<string, number>();

  const runwayPoints: RunwayPoint[] = [];

  let cashFlowPositive = 0;

  for (const model of ready) {
    if (model.metrics === null) {
      continue;
    }

    revenueByCurrency.set(
      model.currency,
      (revenueByCurrency.get(model.currency) ?? 0) + model.metrics.firstYearRevenue,
    );

    const point = runwayPoint(model.metrics.runway);

    if (point) {
      runwayPoints.push(point);
    } else {
      cashFlowPositive += 1;
    }
  }

  const currencyTotals = [...revenueByCurrency.entries()].sort((left, right) => right[1] - left[1]);

  const shownCurrencies = currencyTotals
    .slice(0, 2)
    .map(([currency, total]) => formatCompactCurrencyValue(total, currency));

  const hiddenCurrencies = currencyTotals.length - shownCurrencies.length;

  const revenueLabel =
    ready.length === 0
      ? "—"
      : `${shownCurrencies.join(" · ")}${hiddenCurrencies > 0 ? ` +${hiddenCurrencies}` : ""}`;

  const revenueDetail =
    ready.length === 0
      ? "Complete a model's assumptions to see projections"
      : `Base-case first-year revenue across ${ready.length} ${plural(ready.length, "model")}`;

  let runwayLabel = "—";

  let runwayDetail = "Complete a model's assumptions to see runway";

  if (ready.length > 0) {
    if (runwayPoints.length === 0) {
      runwayLabel = "Self-funding";

      runwayDetail = "Every ready model is cash-flow positive";
    } else {
      const median = medianRunway(runwayPoints);

      runwayLabel = `${median.capped ? ">" : ""}${median.months} mo`;

      runwayDetail = `Median across ${runwayPoints.length} ${plural(runwayPoints.length, "model")}${
        cashFlowPositive > 0 ? `, ${cashFlowPositive} cash-flow positive` : ""
      }`;
    }
  }

  const attention: DashboardAttentionItem[] = [];

  for (const model of models) {
    if (model.status === "SETUP_REQUIRED") {
      attention.push({
        id: `${model.id}:setup`,

        message: `${model.name}: ${model.completedSections} of ${ASSUMPTION_SECTION_COUNT} assumption sections complete`,

        href: `/projects/${model.id}/assumptions`,

        severity: "info",
      });

      continue;
    }

    if (model.status === "READY" && model.metrics) {
      const tone = runwayTone(model.metrics.runway);

      if (tone === "good") {
        continue;
      }

      attention.push({
        id: `${model.id}:runway`,

        message: `${model.name}: runway is ${formatRunway(model.metrics.runway)}`,

        href: `/projects/${model.id}/risk-center`,

        severity: tone === "danger" ? "danger" : "warning",
      });
    }
  }

  attention.sort((left, right) => severityOrder[left.severity] - severityOrder[right.severity]);

  return {
    modelCount: models.length,

    scenarioReady: models.filter((model) => model.scenarioCount >= 3).length,

    forecastReady: ready.length,

    revenueLabel,

    revenueDetail,

    runwayLabel,

    runwayDetail,

    attention: attention.slice(0, MAX_ATTENTION_ITEMS),
  };
}
