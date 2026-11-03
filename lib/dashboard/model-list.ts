import { isSharedModel } from "@/lib/dashboard/model-sharing-status";
import type { DashboardModel } from "@/lib/dashboard/summary";

export type ModelSort = "updated" | "name" | "runway";

export type ModelStatusFilter = "all" | "ready" | "setup" | "shared" | "private";

/** The choices of the filter list, in the order a person sees them. */
export const MODEL_FILTER_OPTIONS: ReadonlyArray<{ value: ModelStatusFilter; label: string }> = [
  { value: "all", label: "All models" },

  { value: "ready", label: "Forecast ready" },

  { value: "setup", label: "Needs setup" },

  { value: "shared", label: "Shared with a workspace" },

  { value: "private", label: "Private to me" },
];

export type ModelListOptions = {
  query: string;
  sort: ModelSort;
  status: ModelStatusFilter;
};

/** Search, sort and filter controls only appear once a list is long enough to need them. */
export const MODEL_LIST_CONTROLS_THRESHOLD = 4;

/**
 * Orders models by urgency: finite runways first (shortest first), then healthy
 * models, then models that do not have a forecast yet.
 */
function runwaySortKey(model: DashboardModel): [number, number] {
  if (model.metrics === null) {
    return [2, 0];
  }

  const runway = model.metrics.runway;

  switch (runway.status) {
    case "ZERO":
      return [0, 0];

    case "EXHAUSTED":
      return [0, runway.months ?? 0];

    case "BEYOND_HORIZON":
      return [1, runway.horizonMonths];

    case "CASH_FLOW_POSITIVE":
      return [1, Number.MAX_SAFE_INTEGER];
  }
}

function compareRunway(left: DashboardModel, right: DashboardModel): number {
  const a = runwaySortKey(left);

  const b = runwaySortKey(right);

  return a[0] - b[0] || a[1] - b[1];
}

export function filterAndSortModels(
  models: DashboardModel[],
  options: ModelListOptions,
): DashboardModel[] {
  const needle = options.query.trim().toLowerCase();

  const matches = models.filter((model) => {
    if (options.status === "ready" && model.status !== "READY") {
      return false;
    }

    if (options.status === "setup" && model.status !== "SETUP_REQUIRED") {
      return false;
    }

    if (options.status === "shared" && isSharedModel(model) === false) {
      return false;
    }

    if (options.status === "private" && isSharedModel(model)) {
      return false;
    }

    if (needle === "") {
      return true;
    }

    return `${model.name} ${model.industry ?? ""}`.toLowerCase().includes(needle);
  });

  const sorted = [...matches];

  switch (options.sort) {
    case "name":
      sorted.sort((left, right) =>
        left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
      );
      break;

    case "runway":
      sorted.sort(compareRunway);
      break;

    case "updated":
      sorted.sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime());
      break;
  }

  return sorted;
}
