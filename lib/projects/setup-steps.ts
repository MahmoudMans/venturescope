/**
 * The three sections a model needs before VentureScope can calculate a forecast.
 * This file is pure (no React, no database), so it is easy to test.
 */

export type SetupStepKey = "general" | "revenue" | "expenses";

export type SetupStepState = "done" | "next" | "todo";

export type SetupCompletion = Record<SetupStepKey, boolean>;

export type SetupStep = {
  key: SetupStepKey;
  title: string;
  description: string;
  href: string;
  state: SetupStepState;
  actionLabel: string;
};

export type SetupProgress = {
  steps: SetupStep[];
  done: number;
  total: number;
  percent: number;
  complete: boolean;
  /** The first section that is not finished yet, or null when all are done. */
  next: SetupStep | null;
};

/** The order in which we ask the person to fill in the sections. */
export const SETUP_STEP_ORDER: readonly SetupStepKey[] = ["general", "revenue", "expenses"];

const STEP_TITLES: Record<SetupStepKey, string> = {
  general: "General assumptions",
  revenue: "Revenue assumptions",
  expenses: "Expense assumptions",
};

const STEP_PATHS: Record<SetupStepKey, string> = {
  general: "assumptions",
  revenue: "revenue",
  expenses: "expenses",
};

export function setupStepHref(projectId: string, key: SetupStepKey): string {
  return `/projects/${projectId}/${STEP_PATHS[key]}`;
}

function describeStep(key: SetupStepKey, revenueMode?: string | null): string {
  if (key === "general") {
    return "Starting cash and tax.";
  }

  if (key === "expenses") {
    return "Cost of goods sold and operating costs.";
  }

  if (revenueMode === "DIRECT") {
    return "Starting revenue and growth.";
  }

  if (revenueMode === "CUSTOMER_DRIVEN") {
    return "Customers, pricing and churn.";
  }

  return "How your business earns revenue.";
}

function actionLabelFor(state: SetupStepState): string {
  if (state === "done") {
    return "Review";
  }

  return state === "next" ? "Set up now" : "Set up";
}

/** Turn the list of missing sections (from the analysis) into a completion map. */
export function completionFromMissing(missing: readonly SetupStepKey[]): SetupCompletion {
  return {
    general: missing.includes("general") === false,
    revenue: missing.includes("revenue") === false,
    expenses: missing.includes("expenses") === false,
  };
}

export function buildSetupProgress(
  projectId: string,
  completion: SetupCompletion,
  revenueMode?: string | null,
): SetupProgress {
  let nextFound = false;

  const steps = SETUP_STEP_ORDER.map((key): SetupStep => {
    let state: SetupStepState = "todo";

    if (completion[key]) {
      state = "done";
    } else if (nextFound === false) {
      state = "next";
      nextFound = true;
    }

    return {
      key,
      title: STEP_TITLES[key],
      description: describeStep(key, revenueMode),
      href: setupStepHref(projectId, key),
      state,
      actionLabel: actionLabelFor(state),
    };
  });

  const done = steps.filter((step) => step.state === "done").length;
  const total = steps.length;

  return {
    steps,
    done,
    total,
    percent: Math.round((done / total) * 100),
    complete: done === total,
    next: steps.find((step) => step.state !== "done") ?? null,
  };
}

/**
 * The first unfinished section that is not the one the person is looking at now.
 * Used for the "Next" card at the bottom of each assumptions page.
 */
export function nextStepAfter(progress: SetupProgress, current: SetupStepKey): SetupStep | null {
  return progress.steps.find((step) => step.state !== "done" && step.key !== current) ?? null;
}
