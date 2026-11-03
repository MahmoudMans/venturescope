import type { DataImportType } from "@/lib/data-import/types";
import { parsePastedNumber } from "@/lib/forms/paste-number";

/**
 * The columns that hold a number, for each kind of import. Only these columns are read with the
 * rules for spreadsheet numbers. Every other column is left as it is.
 */
export const NUMBER_FIELDS: Record<DataImportType, string[]> = {
  ACTUALS: [
    "revenue",
    "cogs",
    "operatingExpenses",
    "ebitda",
    "netIncome",
    "cashFlow",
    "cashBalance",
    "mrr",
    "customers",
  ],
  KPI_TARGETS: ["targetValue"],
  VARIANCE_COMMENTARY: [],
};

/** One dot and exactly three digits after it, such as 1.250: a thousands mark or a decimal point. */
const UNCLEAR_DOT = /^[-+]?\d{1,3}\.\d{3}$/;

/** The dashes: the hyphen, the non-breaking hyphen, the figure, en and em dashes, and the minus. */
const DASHES = [0x2d, 0x2011, 0x2012, 0x2013, 0x2014, 0x2212]
  .map((code) => String.fromCharCode(code))
  .join("");

/** One dash, or two or three of them, with nothing else. */
const ONLY_DASHES = new RegExp(`^[${DASHES}]{1,3}$`);

/** The words that mean "no number": n/a, #N/A, n/d (not available in French), nc, n.a. and n.d. */
const NO_NUMBER_WORDS = /^(?:#?n\/?a|n\/?d|nc|n\.a\.?|n\.d\.?)$/i;

/**
 * Tells if a cell says "no number" instead of holding one: a lone dash, or n/a. Finance sheets write
 * a dash for a month with nothing in it. It is not a zero and it is not an error, so it is read as an
 * empty cell.
 */
export function isNoNumber(text: string): boolean {
  const value = text.trim();

  return ONLY_DASHES.test(value) || NO_NUMBER_WORDS.test(value);
}

export type ImportNumber = { ok: true; text: string } | { ok: false; message: string };

/**
 * Reads one number of an import file and gives back a plain number text that Number() understands.
 * A number that cannot be read is given back as it was, so the normal check says it is not valid.
 *
 * In a file with semicolons (decimalComma is true) the comma is the decimal mark: 1250,50 is
 * 1250.50 and 1,250 is 1.250. In a file with commas or tabs, a comma and exactly three digits
 * (1,250) is a group of thousands, as in a paste. In a file with semicolons, 1.250 could be a
 * thousands mark (a German file) or a decimal point (a file made by a script), so it is not read:
 * the person is asked to write it in a clear way. This way no number is wrong by a factor of 1000.
 */
export function readImportNumber(raw: string, decimalComma: boolean): ImportNumber {
  const text = raw.trim();

  if (decimalComma && UNCLEAR_DOT.test(text)) {
    return {
      ok: false,
      message: `"${text}" is not clear. Write ${text.replace(".", "")} if the dot is a thousands mark, or ${text.replace(".", ",")} if it is a decimal point.`,
    };
  }

  return { ok: true, text: parsePastedNumber(text, decimalComma) ?? raw };
}

export type RecordNumbers = {
  record: Record<string, string>;
  problems: { field: string; message: string }[];
  /** How many cells said "no number" (a dash or n/a) and were read as empty. */
  emptied: number;
};

/**
 * Reads the number columns of one row. Gives back a copy of the row with plain number texts, and the
 * problems for the numbers that are not clear. The row that was read from the file does not change.
 * In an Actuals file a dash or n/a means "no number" and the cell becomes empty. A target of a KPI
 * file must be a number, so a dash is still refused there.
 */
export function readRecordNumbers(
  importType: DataImportType,
  record: Record<string, string>,
  decimalComma: boolean,
): RecordNumbers {
  const next = { ...record };

  const problems: { field: string; message: string }[] = [];

  let emptied = 0;

  for (const field of NUMBER_FIELDS[importType]) {
    const raw = record[field];

    if (raw === undefined) {
      continue;
    }

    if (importType === "ACTUALS" && isNoNumber(raw)) {
      next[field] = "";

      emptied += 1;

      continue;
    }

    const read = readImportNumber(raw, decimalComma);

    if (read.ok) {
      next[field] = read.text;
    } else {
      problems.push({ field, message: read.message });
    }
  }

  return { record: next, problems, emptied };
}
