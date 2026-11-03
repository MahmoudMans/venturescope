/** The address of the download. The Profile and Security pages link to it. */
export const DATA_EXPORT_PATH = "/api/account/export";

/** The folder that holds everything inside the ZIP file. */
export const DATA_EXPORT_ROOT = "venturescope-data";

export const MODEL_BACKUP_FILE = "model-backup.json";

export const ACTUAL_RESULTS_FILE = "actual-results.csv";

export const KPI_TARGETS_FILE = "kpi-targets.csv";

export const VARIANCE_COMMENTS_FILE = "variance-comments.csv";

/** A person can start this many downloads in each time window. */
export const DATA_EXPORT_LIMIT = 5;

export const DATA_EXPORT_WINDOW_MS = 10 * 60 * 1000;

/** The database tables that hold the data of one model and are part of the download. */
export const DATA_EXPORT_INCLUDED_TABLES: readonly string[] = [
  "Scenario",
  "FinancingEvent",
  "MonthlyOverride",
  "ActualPeriod",
  "ProjectKpiTarget",
  "VarianceCommentary",
];

export type LeftOutData = {
  /** The name of the table in prisma/schema.prisma. */
  table: string;

  /** How the data is called in the app. */
  label: string;
};

/**
 * Data of a model that is not in the download. A test checks every table of a
 * model against the two lists, so a new table cannot be forgotten.
 */
export const DATA_EXPORT_LEFT_OUT: readonly LeftOutData[] = [
  { table: "ProjectRevision", label: "saved versions" },

  { table: "ForecastBaseline", label: "saved baselines" },

  { table: "ProjectRiskPolicy", label: "risk settings" },

  { table: "DecisionAction", label: "decisions" },

  { table: "ExecutiveReview", label: "reviews" },

  { table: "ApprovalRequest", label: "approvals" },

  { table: "FinancialPeriodState", label: "period close records" },

  { table: "FinancialPeriodEvent", label: "period close records" },

  { table: "ProjectAuditEvent", label: "the activity history" },

  { table: "ProjectAlertReceipt", label: "alert read marks" },

  { table: "DataImportBatch", label: "the import history" },
];

/** The labels of the data that is left out, each one once, in the same order. */
export function leftOutLabels(): string[] {
  const labels: string[] = [];

  for (const item of DATA_EXPORT_LEFT_OUT) {
    if (labels.includes(item.label) === false) {
      labels.push(item.label);
    }
  }

  return labels;
}

/** "a, b and c" */
function joinWithAnd(values: readonly string[]): string {
  if (values.length <= 1) {
    return values.join("");
  }

  return `${values.slice(0, -1).join(", ")} and ${values[values.length - 1]}`;
}

/** A short sentence for the Profile page and the Help center. */
export const DATA_EXPORT_LEFT_OUT_NOTE =
  "Some records are not included, such as the activity history, saved versions, reviews, decisions and approvals.";

/** The full list, for the README inside the download. */
export function leftOutSentence(): string {
  return joinWithAnd(leftOutLabels());
}
