import type { DataImportBatchView, DataImportType } from "@/lib/data-import/types";

/** How many attempts of the import history a phone or a tablet shows before the person asks. */
export const FIRST_ATTEMPTS_SHOWN = 3;

/**
 * The fewest attempts that the button may hide. An attempt is about 170px of page on a phone, and
 * a failed one with its error is about 300px, so a button is worth its tap when it hides three.
 * A history with fewer attempts than the first ones plus this many is shown whole.
 */
export const FEWEST_ATTEMPTS_HIDDEN = 3;

/** True when the history is long enough to hide some of its attempts behind a button. */
function isFolded(total: number): boolean {
  return total >= FIRST_ATTEMPTS_SHOWN + FEWEST_ATTEMPTS_HIDDEN;
}

/**
 * True when an attempt is out of sight on a phone or a tablet: the history is folded, the person
 * has not asked for the others, and this attempt is after the first ones. A wide screen shows every
 * attempt, so this is only a hint for the screens below 1280px.
 */
export function isAttemptFolded(index: number, total: number, expanded: boolean): boolean {
  return isFolded(total) && expanded === false && index >= FIRST_ATTEMPTS_SHOWN;
}

/** The words on the button under the history, or null when the history has no button. */
export function describeAttemptToggle(total: number, expanded: boolean): string | null {
  if (isFolded(total) === false) {
    return null;
  }

  if (expanded) {
    return "Show fewer attempts";
  }

  const hidden = total - FIRST_ATTEMPTS_SHOWN;

  return `Show ${hidden} more ${hidden === 1 ? "attempt" : "attempts"}`;
}

/** The name of a kind of import, as the person sees it. */
export function describeImportType(type: DataImportType): string {
  switch (type) {
    case "ACTUALS":
      return "Actuals";

    case "KPI_TARGETS":
      return "KPI Targets";

    case "VARIANCE_COMMENTARY":
      return "Variance Commentary";
  }
}

/** The word for the status of an attempt. A status that is not known is shown as it is. */
export function describeImportStatus(status: string): string {
  switch (status) {
    case "SUCCEEDED":
      return "Succeeded";

    case "FAILED":
      return "Failed";

    case "PROCESSING":
      return "Processing";

    default:
      return status;
  }
}

/** The color of the word for a status. It is never the only sign, the word is always there. */
export function importStatusTone(status: string): string {
  switch (status) {
    case "SUCCEEDED":
      return "text-success";

    case "FAILED":
      return "text-destructive";

    default:
      return "text-warning";
  }
}

/** The time of an attempt, in the language and the time zone of the person's browser. */
export function describeAttemptTime(createdAt: string): string {
  const time = new Date(createdAt);

  return Number.isNaN(time.getTime()) ? "Unknown time" : time.toLocaleString();
}

/** The person who made the attempt, or a word when the account is gone. */
export function describeAttemptUser(createdBy: string | null): string {
  return createdBy ?? "Unavailable";
}

/** The four counts of an attempt, with the name that goes above each one. */
export function describeAttemptCounts(
  batch: DataImportBatchView,
): Array<{ label: string; value: number }> {
  return [
    { label: "Rows", value: batch.rowCount },
    { label: "Inserted", value: batch.insertedCount },
    { label: "Updated", value: batch.updatedCount },
    { label: "Rejected", value: batch.rejectedCount },
  ];
}
