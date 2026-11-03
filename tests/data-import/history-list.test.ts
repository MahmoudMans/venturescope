import { describe, expect, it } from "vitest";

import {
  describeAttemptCounts,
  describeAttemptTime,
  describeAttemptToggle,
  describeAttemptUser,
  describeImportStatus,
  describeImportType,
  FEWEST_ATTEMPTS_HIDDEN,
  FIRST_ATTEMPTS_SHOWN,
  importStatusTone,
  isAttemptFolded,
} from "@/lib/data-import/history-list";
import type { DataImportBatchView } from "@/lib/data-import/types";

/** An attempt of the history with the counts that the test gives it. */
function attempt(rows: number, inserted: number, updated: number, rejected: number) {
  const batch: DataImportBatchView = {
    id: "batch-1",
    importType: "ACTUALS",
    fileName: "actuals.csv",
    status: "SUCCEEDED",
    rowCount: rows,
    insertedCount: inserted,
    updatedCount: updated,
    rejectedCount: rejected,
    errorSummary: null,
    createdBy: null,
    createdAt: "2027-03-30T09:00:00.000Z",
    completedAt: null,
  };

  return batch;
}

/** How many of the attempts of a history of this size are folded away. */
function foldedCount(total: number, expanded: boolean): number {
  let count = 0;

  for (let index = 0; index < total; index += 1) {
    if (isAttemptFolded(index, total, expanded)) {
      count += 1;
    }
  }

  return count;
}

describe("the numbers of the history on a phone", () => {
  it("shows 3 attempts first and hides at least 3", () => {
    expect(FIRST_ATTEMPTS_SHOWN).toBe(3);

    expect(FEWEST_ATTEMPTS_HIDDEN).toBe(3);
  });
});

describe("which attempts a phone folds away", () => {
  it("folds nothing in a history of 5 attempts or fewer", () => {
    for (let total = 0; total <= 5; total += 1) {
      expect(foldedCount(total, false), `${total} closed`).toBe(0);

      expect(foldedCount(total, true), `${total} opened`).toBe(0);
    }
  });

  it("folds everything after the first 3 attempts of a longer history", () => {
    for (let total = 6; total <= 100; total += 1) {
      expect(foldedCount(total, false), `${total} closed`).toBe(total - 3);

      for (let index = 0; index < total; index += 1) {
        expect(isAttemptFolded(index, total, false), `${total}, ${index}`).toBe(index >= 3);
      }
    }
  });

  it("folds nothing when the person has asked for the others", () => {
    for (let total = 0; total <= 100; total += 1) {
      expect(foldedCount(total, true), `${total} opened`).toBe(0);
    }
  });

  it("changes at 6, the first history where the button hides 3 attempts", () => {
    expect(foldedCount(5, false)).toBe(0);

    expect(foldedCount(6, false)).toBe(3);

    expect(FIRST_ATTEMPTS_SHOWN + FEWEST_ATTEMPTS_HIDDEN).toBe(6);
  });

  it("never hides fewer attempts than the least that it may hide", () => {
    for (let total = 0; total <= 100; total += 1) {
      const hidden = foldedCount(total, false);

      expect(hidden === 0 || hidden >= FEWEST_ATTEMPTS_HIDDEN, `${total} attempts`).toBe(true);
    }
  });
});

describe("the words on the button under the history", () => {
  it("has no button for a history of 5 attempts or fewer", () => {
    for (let total = 0; total <= 5; total += 1) {
      expect(describeAttemptToggle(total, false), `${total} closed`).toBe(null);

      expect(describeAttemptToggle(total, true), `${total} opened`).toBe(null);
    }
  });

  it("says how many attempts the button shows", () => {
    expect(describeAttemptToggle(6, false)).toBe("Show 3 more attempts");

    expect(describeAttemptToggle(7, false)).toBe("Show 4 more attempts");

    expect(describeAttemptToggle(12, false)).toBe("Show 9 more attempts");

    expect(describeAttemptToggle(100, false)).toBe("Show 97 more attempts");
  });

  it("offers to make the history short again when it is open", () => {
    for (let total = 6; total <= 100; total += 1) {
      expect(describeAttemptToggle(total, true), String(total)).toBe("Show fewer attempts");
    }
  });

  it("counts the attempts that are folded away, so the button and the blocks agree", () => {
    for (let total = 6; total <= 100; total += 1) {
      expect(describeAttemptToggle(total, false), String(total)).toBe(
        `Show ${foldedCount(total, false)} more attempts`,
      );
    }
  });
});

describe("the words for a kind of import and for a status", () => {
  it("names the three kinds of import", () => {
    expect(describeImportType("ACTUALS")).toBe("Actuals");

    expect(describeImportType("KPI_TARGETS")).toBe("KPI Targets");

    expect(describeImportType("VARIANCE_COMMENTARY")).toBe("Variance Commentary");
  });

  it("writes the three statuses as plain words", () => {
    expect(describeImportStatus("SUCCEEDED")).toBe("Succeeded");

    expect(describeImportStatus("FAILED")).toBe("Failed");

    expect(describeImportStatus("PROCESSING")).toBe("Processing");
  });

  it("shows a status that is not known as it is", () => {
    expect(describeImportStatus("QUEUED")).toBe("QUEUED");

    expect(describeImportStatus("")).toBe("");
  });

  it("gives a color to each status", () => {
    expect(importStatusTone("SUCCEEDED")).toBe("text-success");

    expect(importStatusTone("FAILED")).toBe("text-destructive");

    expect(importStatusTone("PROCESSING")).toBe("text-warning");

    expect(importStatusTone("QUEUED")).toBe("text-warning");
  });

  it("never uses the same color for a status that went well and one that failed", () => {
    expect(importStatusTone("SUCCEEDED")).not.toBe(importStatusTone("FAILED"));

    expect(importStatusTone("FAILED")).not.toBe(importStatusTone("PROCESSING"));
  });
});

describe("the time, the person and the counts of an attempt", () => {
  it("writes the time as the browser writes it", () => {
    for (const time of ["2027-03-30T09:00:00.000Z", "2027-12-31T23:59:59.000Z"]) {
      expect(describeAttemptTime(time), time).toBe(new Date(time).toLocaleString());
    }
  });

  it("says that the time is unknown when the text is not a time", () => {
    expect(describeAttemptTime("")).toBe("Unknown time");

    expect(describeAttemptTime("not a time")).toBe("Unknown time");
  });

  it("names the person, or says that the account is not available", () => {
    expect(describeAttemptUser("Amal Ben Salah")).toBe("Amal Ben Salah");

    expect(describeAttemptUser("amal@example.com")).toBe("amal@example.com");

    expect(describeAttemptUser(null)).toBe("Unavailable");
  });

  it("gives the four counts in the same order, with the name of each", () => {
    expect(describeAttemptCounts(attempt(12, 10, 2, 0))).toEqual([
      { label: "Rows", value: 12 },
      { label: "Inserted", value: 10 },
      { label: "Updated", value: 2 },
      { label: "Rejected", value: 0 },
    ]);
  });

  it("keeps a count of zero, so that every attempt shows four counts", () => {
    const counts = describeAttemptCounts(attempt(0, 0, 0, 0));

    expect(counts).toHaveLength(4);

    for (const count of counts) {
      expect(count.value, count.label).toBe(0);
    }
  });
});
