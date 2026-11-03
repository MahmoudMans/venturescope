import { type CsvRow, parseCsvRows } from "@/lib/data-import/csv";
import {
  type CsvDelimiter,
  delimiterCandidates,
  readDeclaredDelimiter,
} from "@/lib/data-import/delimiter";
import { describeNoNumbers, readColumnTitles } from "@/lib/data-import/headers";
import type { DataImportType } from "@/lib/data-import/types";

/** The most rows that are looked at to find the column titles. */
export const MOST_ROWS_SEARCHED = 200;

/**
 * How well a row looks like the row of the column titles: a score, and the score of a complete row.
 * A row of notes has score 0. A row that holds all the titles that a file needs has the full score.
 */
export type TitleRules = {
  score: (cells: string[]) => number;
  full: number;
};

/**
 * The rules for the column titles of one kind of file. Each title that the file needs gives one
 * point, and an Actuals file also needs one column with numbers. A row where two columns are read as
 * the same field has the full score: it is the row of titles, and the check of the titles says what
 * is wrong with it.
 */
export function titleRules(importType: DataImportType, required: string[]): TitleRules {
  const needsNumbers = importType === "ACTUALS";

  const full = required.length + (needsNumbers ? 1 : 0);

  return {
    full,
    score: (cells) => {
      try {
        const fields = readColumnTitles(importType, cells).fields;

        const found = required.filter((field) => fields.includes(field)).length;

        const numbers = needsNumbers && describeNoNumbers(importType, fields) === null ? 1 : 0;

        return found + numbers;
      } catch {
        return full;
      }
    },
  };
}

export type FoundTable<Row> = {
  /** The mark between the cells that was used. */
  delimiter: CsvDelimiter;
  /** The rows of the file, read with that mark, as the parser gave them. */
  rows: Row[];
  /** The place of the row of titles in the list, or -1 when no row looks like it. */
  index: number;
  /** True when that row holds all the titles that the file needs. */
  complete: boolean;
};

/**
 * Finds the mark between the cells and the row of the column titles together, because each one is
 * needed to find the other. A mark is right when a row has the column titles when the file is read
 * with it. The marks are tried one by one (see {@link delimiterCandidates}). When no mark gives a
 * complete row of titles, the row with the most titles is taken, so the message can say which titles
 * are missing.
 */
export function findTable<Row>(
  input: string,
  parse: (delimiter: CsvDelimiter) => Row[],
  rules: { score: (row: Row) => number; full: number },
): FoundTable<Row> {
  const candidates = delimiterCandidates(input);

  let best: FoundTable<Row> | null = null;

  let bestScore = 0;

  for (const delimiter of candidates) {
    const rows = parse(delimiter);

    for (let index = 0; index < Math.min(rows.length, MOST_ROWS_SEARCHED); index += 1) {
      const score = rules.score(rows[index]);

      if (score >= rules.full) {
        return { delimiter, rows, index, complete: true };
      }

      if (score > bestScore) {
        bestScore = score;

        best = { delimiter, rows, index, complete: false };
      }
    }
  }

  if (best !== null) {
    return best;
  }

  return { delimiter: candidates[0], rows: parse(candidates[0]), index: -1, complete: false };
}

/**
 * Takes away the first row when it is a line like "sep=;". Excel writes this line to say which mark
 * is used, and it does not show it in the sheet, so it is not a row and it is not counted.
 */
export function dropSepLine<Row>(input: string, rows: Row[]): Row[] {
  return readDeclaredDelimiter(input) === null ? rows : rows.slice(1);
}

export type CsvTable = {
  delimiter: CsvDelimiter;
  /** The titles of the columns that are kept, as they are written in the file. */
  headers: string[];
  /** One object for each row of data, with a text for each title. */
  records: Record<string, string>[];
  /** The number of each record in the file, as a spreadsheet counts rows. */
  rowNumbers: number[];
  /** The row of the file that holds the titles. It is 1 when the file starts with them. */
  titleRow: number;
  /** How many columns with no title and no value were left out. */
  emptyColumns: number;
  /** For each record: how many of its values stand in a column that has no title. */
  untitled: number[];
};

/**
 * How many cells of a row have a value in a column that has no title: a column after the last
 * title, or a column with an empty title. Such a value has no field to go to, so it must not be
 * dropped in silence.
 */
export function countUntitled(titles: string[], cells: string[]): number {
  let total = 0;

  cells.forEach((cell, column) => {
    if (cell.trim() !== "" && (titles[column] ?? "").trim() === "") {
      total += 1;
    }
  });

  return total;
}

/** The sentence about a row that has values in columns with no title. */
export function describeUntitled(count: number): string {
  const one = count === 1;

  const values = one ? "1 value in a column" : `${count} values in columns`;

  const fix = one ? "Add a title for it, or delete it." : "Add titles for them, or delete them.";

  const quotes = one ? "If it belongs" : "If they belong";

  return `This row has ${values} with no title. ${fix} ${quotes} to a text, put the whole text in quotes.`;
}

/**
 * Reads a file as a table. The titles do not have to be on the first row: a title line, a report
 * name or an empty row can stand above them. A column with no title and no value in any row, such as
 * the empty cells that Excel keeps at the end of a row, is left out. A column with values and no
 * title is refused. A value after the last title has no column, so it is counted for its row in
 * `untitled` and the caller says so. Every record has the number of its row in the file, so a
 * message can name it. When no row looks like the row of titles, the first row is used, as before.
 */
export function readCsvTable(input: string, rules: TitleRules): CsvTable {
  const found = findTable(input, (delimiter) => readRows(input, delimiter), {
    score: (row) => rules.score(row.cells),
    full: rules.full,
  });

  const rows = found.rows;

  if (rows.length === 0) {
    throw new Error("CSV is empty.");
  }

  const start = Math.max(found.index, 0);

  const titleCells = rows[start].cells;

  const body = rows.slice(start + 1);

  const kept: number[] = [];

  let emptyColumns = 0;

  titleCells.forEach((title, column) => {
    const empty =
      title.trim() === "" && body.every((row) => (row.cells[column] ?? "").trim() === "");

    if (empty) {
      emptyColumns += 1;
    } else {
      kept.push(column);
    }
  });

  const headers = kept.map((column) => titleCells[column].trim());

  if (headers.some((header) => header === "")) {
    throw new Error("CSV contains an empty header.");
  }

  if (new Set(headers).size !== headers.length) {
    throw new Error("CSV contains duplicate headers.");
  }

  const records = body.map((row) =>
    Object.fromEntries(headers.map((header, place) => [header, row.cells[kept[place]] ?? ""])),
  );

  return {
    delimiter: found.delimiter,
    headers,
    records,
    rowNumbers: body.map((row) => row.row),
    titleRow: rows[start].row,
    emptyColumns,
    untitled: body.map((row) => countUntitled(titleCells, row.cells)),
  };
}

/** The rows of a file without its "sep=" line, numbered as a spreadsheet shows them. */
function readRows(input: string, delimiter: CsvDelimiter): CsvRow[] {
  const rows = parseCsvRows(input, delimiter);

  if (readDeclaredDelimiter(input) === null) {
    return rows;
  }

  return rows.slice(1).map((row) => ({ row: row.row - 1, cells: row.cells }));
}

/** What the reader did with the layout of a file, to tell the person. */
export type TableLayout = {
  titleRow: number;
  emptyColumns: number;
  emptyNumbers: number;
};

function count(amount: number, one: string, many: string): string {
  return `${amount} ${amount === 1 ? one : many}`;
}

/**
 * Tells how the layout of a file was read, or null when the file starts with its titles and nothing
 * was left out. It shows a title row that is not the first row, the empty columns that were left
 * out, and the cells with a dash or n/a that were read as empty, so nothing is changed in silence.
 */
export function describeLayout(layout: TableLayout): string | null {
  const parts: string[] = [];

  if (layout.titleRow > 1) {
    const above = layout.titleRow - 1;

    parts.push(
      above === 1
        ? `The column titles are on row ${layout.titleRow}. The row above them was not used.`
        : `The column titles are on row ${layout.titleRow}. The ${above} rows above them were not used.`,
    );
  }

  if (layout.emptyColumns > 0) {
    const text = count(layout.emptyColumns, "empty column", "empty columns");

    parts.push(`${text} ${layout.emptyColumns === 1 ? "was" : "were"} left out.`);
  }

  if (layout.emptyNumbers > 0) {
    const text = count(layout.emptyNumbers, "cell", "cells");

    parts.push(
      `${text} with a dash or n/a ${layout.emptyNumbers === 1 ? "was" : "were"} read as empty.`,
    );
  }

  return parts.length > 0 ? parts.join(" ") : null;
}
