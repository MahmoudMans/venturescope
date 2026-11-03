/** How many rows of the preview a phone shows before the person asks for the others. */
export const FIRST_PREVIEW_ROWS_SHOWN = 2;

/**
 * The fewest rows that the button may hide. A row of a file with ten columns is about 240px of page
 * on a phone, so a button is worth its tap even when it hides a single row. A preview with fewer
 * rows than the first rows plus this many is shown whole.
 */
export const FEWEST_PREVIEW_ROWS_HIDDEN = 1;

/** The most characters of a value that still shares a line with the next one on a phone. */
export const LONGEST_SHORT_VALUE = 24;

/** True when the preview is long enough to hide some of its rows behind a button. */
function isFolded(total: number): boolean {
  return total >= FIRST_PREVIEW_ROWS_SHOWN + FEWEST_PREVIEW_ROWS_HIDDEN;
}

/**
 * How many rows of the preview a phone shows. It is all of them when the person asked for them, or
 * when there are too few to be worth a button.
 */
export function previewRowsInView(total: number, expanded: boolean): number {
  if (isFolded(total) && expanded === false) {
    return FIRST_PREVIEW_ROWS_SHOWN;
  }

  return total;
}

/** The words on the button under the preview on a phone, or null when the preview has no button. */
export function describePreviewToggle(total: number, expanded: boolean): string | null {
  if (isFolded(total) === false) {
    return null;
  }

  if (expanded) {
    return "Show fewer rows";
  }

  const hidden = total - FIRST_PREVIEW_ROWS_SHOWN;

  return `Show ${hidden} more ${hidden === 1 ? "row" : "rows"}`;
}

/**
 * The name of a row of the preview on a phone. It counts the rows of the preview, not the rows of
 * the file, because the file may have a title line and empty lines that the preview does not show.
 */
export function describePreviewRow(index: number): string {
  return `Preview row ${index + 1}`;
}

/** The text of a value on a phone. A value with nothing in it says so, instead of a blank space. */
export function describePreviewValue(value: string): string {
  return value === "" ? "(empty)" : value;
}

/** True when a value is too long to share a line with the next one on a phone. */
export function isLongPreviewValue(value: string): boolean {
  return value.length > LONGEST_SHORT_VALUE;
}
