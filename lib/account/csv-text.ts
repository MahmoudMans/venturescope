/**
 * Excel needs this mark at the start of a file to read accents and other
 * non-English letters correctly. The CSV reader of the Data Import Center skips it.
 */
export const CSV_BYTE_ORDER_MARK = "\ufeff";

export type CsvValue = string | number | null | undefined;

export type CsvColumn = {
  header: string;

  /**
   * "text" is words that a person typed. "plain" is numbers, months and codes
   * that the app controls, which are written exactly as they are.
   */
  kind: "text" | "plain";
};

/**
 * A spreadsheet runs text that starts with = + - or @ as a formula. Another
 * person can type such text into a shared model, so a quote goes in front of it.
 */
export function neutralizeFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

export function csvCell(value: CsvValue, kind: CsvColumn["kind"]): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "number" && Number.isFinite(value) === false) {
    return "";
  }

  const raw = String(value);

  const safe = kind === "text" ? neutralizeFormula(raw) : raw;

  if (/[",\r\n]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }

  return safe;
}

/** A CSV file as text: a header line, one line for each row, and a mark for Excel. */
export function toCsv(
  columns: readonly CsvColumn[],
  rows: ReadonlyArray<ReadonlyArray<CsvValue>>,
): string {
  const lines = [columns.map((column) => csvCell(column.header, "plain")).join(",")];

  for (const row of rows) {
    lines.push(columns.map((column, index) => csvCell(row[index], column.kind)).join(","));
  }

  return `${CSV_BYTE_ORDER_MARK}${lines.join("\n")}\n`;
}
