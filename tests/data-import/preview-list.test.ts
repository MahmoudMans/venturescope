import { describe, expect, it } from "vitest";

import {
  describePreviewRow,
  describePreviewToggle,
  describePreviewValue,
  FEWEST_PREVIEW_ROWS_HIDDEN,
  FIRST_PREVIEW_ROWS_SHOWN,
  isLongPreviewValue,
  LONGEST_SHORT_VALUE,
  previewRowsInView,
} from "@/lib/data-import/preview-list";
import { validateDataImportCsv } from "@/lib/data-import/validation";

/** An Actuals file with this many months, each with a good number. */
function goodMonths(count: number): string {
  const lines = ["period,revenue"];

  for (let index = 0; index < count; index += 1) {
    const year = 2027 + Math.floor(index / 12);

    const month = String((index % 12) + 1).padStart(2, "0");

    lines.push(`${year}-${month},${1000 + index}`);
  }

  return lines.join("\n");
}

/** The words of the button for a file with this many months. */
function buttonFor(months: number): string | null {
  const preview = validateDataImportCsv({
    importType: "ACTUALS",
    csv: goodMonths(months),
  }).preview;

  return describePreviewToggle(preview.length, false);
}

describe("the numbers of the preview on a phone", () => {
  it("shows 2 rows first, hides at least 1, and calls a value long after 24 characters", () => {
    expect(FIRST_PREVIEW_ROWS_SHOWN).toBe(2);

    expect(FEWEST_PREVIEW_ROWS_HIDDEN).toBe(1);

    expect(LONGEST_SHORT_VALUE).toBe(24);
  });
});

describe("how many rows of the preview a phone shows", () => {
  it("shows all of a preview with 2 rows or fewer, opened or not", () => {
    for (let total = 0; total <= 2; total += 1) {
      expect(previewRowsInView(total, false), `${total} closed`).toBe(total);

      expect(previewRowsInView(total, true), `${total} opened`).toBe(total);
    }
  });

  it("shows the first 2 rows of a longer preview until the person asks for the others", () => {
    for (let total = 3; total <= 8; total += 1) {
      expect(previewRowsInView(total, false), `${total} closed`).toBe(2);

      expect(previewRowsInView(total, true), `${total} opened`).toBe(total);
    }
  });

  it("changes at 3, the first preview where the button hides a row", () => {
    expect(previewRowsInView(2, false)).toBe(2);

    expect(previewRowsInView(3, false)).toBe(2);

    expect(FIRST_PREVIEW_ROWS_SHOWN + FEWEST_PREVIEW_ROWS_HIDDEN).toBe(3);
  });

  it("never hides fewer rows than the least that it may hide", () => {
    for (let total = 0; total <= 8; total += 1) {
      const hidden = total - previewRowsInView(total, false);

      expect(hidden === 0 || hidden >= FEWEST_PREVIEW_ROWS_HIDDEN, `${total} rows`).toBe(true);
    }
  });
});

describe("the words on the button under the preview on a phone", () => {
  it("has no button for a preview with 2 rows or fewer", () => {
    for (let total = 0; total <= 2; total += 1) {
      expect(describePreviewToggle(total, false), `${total} closed`).toBe(null);

      expect(describePreviewToggle(total, true), `${total} opened`).toBe(null);
    }
  });

  it("says 'row' for one hidden row and 'rows' for more", () => {
    expect(describePreviewToggle(3, false)).toBe("Show 1 more row");

    expect(describePreviewToggle(4, false)).toBe("Show 2 more rows");

    expect(describePreviewToggle(5, false)).toBe("Show 3 more rows");

    expect(describePreviewToggle(8, false)).toBe("Show 6 more rows");
  });

  it("offers to make the preview short again when it is open", () => {
    for (let total = 3; total <= 8; total += 1) {
      expect(describePreviewToggle(total, true), String(total)).toBe("Show fewer rows");
    }
  });

  it("counts the rows that the preview holds, so the button and the blocks agree", () => {
    for (let total = 3; total <= 8; total += 1) {
      const hidden = total - previewRowsInView(total, false);

      const word = hidden === 1 ? "row" : "rows";

      expect(describePreviewToggle(total, false), String(total)).toBe(
        `Show ${hidden} more ${word}`,
      );
    }
  });
});

describe("the name and the text of a row on a phone", () => {
  it("counts the rows of the preview from 1", () => {
    expect(describePreviewRow(0)).toBe("Preview row 1");

    expect(describePreviewRow(1)).toBe("Preview row 2");

    expect(describePreviewRow(7)).toBe("Preview row 8");
  });

  it("says that a value with nothing in it is empty", () => {
    expect(describePreviewValue("")).toBe("(empty)");
  });

  it("keeps every other value as it is, even a zero or a space", () => {
    for (const value of ["0", "100000", "Commercial Lead", " ", "(empty)", "2027-01"]) {
      expect(describePreviewValue(value), JSON.stringify(value)).toBe(value);
    }
  });

  it("calls a value long when it has more than 24 characters", () => {
    expect(isLongPreviewValue("")).toBe(false);

    expect(isLongPreviewValue("x".repeat(24))).toBe(false);

    expect(isLongPreviewValue("x".repeat(25))).toBe(true);

    expect(isLongPreviewValue("Pipeline conversion below plan")).toBe(true);

    expect(isLongPreviewValue("Commercial Lead")).toBe(false);
  });
});

describe("a real file", () => {
  it("has a preview of 8 rows at most, so the button shows 6 for a long file", () => {
    expect(buttonFor(12)).toBe("Show 6 more rows");

    expect(buttonFor(9)).toBe("Show 6 more rows");

    expect(buttonFor(8)).toBe("Show 6 more rows");
  });

  it("has a button that shows 1 row for a file with 3 rows", () => {
    expect(buttonFor(3)).toBe("Show 1 more row");
  });

  it("has no button for a file with 2 rows or 1 row", () => {
    expect(buttonFor(2)).toBe(null);

    expect(buttonFor(1)).toBe(null);
  });

  it("has 5 rows and a button that shows 3", () => {
    expect(buttonFor(5)).toBe("Show 3 more rows");
  });
});
