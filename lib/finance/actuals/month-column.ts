import { parseMonthKey } from "@/lib/finance/actuals/month";

/**
 * Excel changes what a person types in a month cell. A month typed as 2027-01 becomes a date, and
 * the CSV file then holds 01/01/2027 (day first, in France, Tunisia and Germany) or 1/1/2027 (month
 * first, in the United States). The same date can mean two months: 03/04/2027 is 3 April or 4 March.
 * This file reads such dates for a whole column at once, so one sure answer can be found.
 */
export type MonthColumnOptions = {
  /** True when a month may appear only once, as in an Actuals file with one row per month. */
  unique: boolean;
  /** True for a file separated by semicolons: those files come from countries that write the day first. */
  dayFirstDefault: boolean;
};

export type MonthColumn = {
  /** The same cells. A full date is replaced by its month (2027-02). Other cells do not change. */
  cells: string[];
  /** Set when the dates cannot be read in one sure way. The cells are then not changed. */
  problem: { index: number; message: string } | null;
};

const FULL_DATE = /^(\d{1,2})([/.-])(\d{1,2})\2(\d{4})(?:[ T]\d{1,2}:\d{2}(?::\d{2})?)?$/;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type DateParts = { first: number; second: number; year: number };

type Entry = {
  cell: string;
  parts: DateParts | null;
  asDayMonth: string | null;
  asMonthDay: string | null;
};

function readParts(cell: string): DateParts | null {
  const match = FULL_DATE.exec(cell.trim());

  if (match === null) {
    return null;
  }

  return { first: Number(match[1]), second: Number(match[3]), year: Number(match[4]) };
}

/** The month (2027-02) of a date, or null when that date does not exist in the chosen order. */
function monthOf(parts: DateParts, dayFirst: boolean): string | null {
  const day = dayFirst ? parts.first : parts.second;

  const month = dayFirst ? parts.second : parts.first;

  const key = parseMonthKey(`${parts.year}-${month}`);

  const lastDay = new Date(Date.UTC(parts.year, month, 0)).getUTCDate();

  return day >= 1 && day <= lastDay ? key : null;
}

function repeats(keys: string[]): boolean {
  return new Set(keys).size < keys.length;
}

/**
 * Reads the full dates of one month column. The order of the date is taken from the first sure sign:
 * a number above 12 can only be a day (31/01/2027 is day first, 01/31/2027 is month first). When no
 * date shows the order, an Actuals file (one row per month) takes the order in which no month
 * repeats, and a file with semicolons takes the day first. Anything else is not guessed: the person
 * is asked to write the month as 2027-02.
 */
export function readMonthColumn(cells: string[], options: MonthColumnOptions): MonthColumn {
  const entries: Entry[] = cells.map((cell) => {
    const parts = readParts(cell);

    return {
      cell,
      parts,
      asDayMonth: parts === null ? null : monthOf(parts, true),
      asMonthDay: parts === null ? null : monthOf(parts, false),
    };
  });

  const dayFirstSigns = entries.flatMap((entry, index) =>
    entry.asDayMonth !== null && entry.asMonthDay === null ? [index] : [],
  );

  const monthFirstSigns = entries.flatMap((entry, index) =>
    entry.asMonthDay !== null && entry.asDayMonth === null ? [index] : [],
  );

  if (dayFirstSigns.length > 0 && monthFirstSigns.length > 0) {
    return {
      cells,
      problem: {
        index: Math.max(dayFirstSigns[0], monthFirstSigns[0]),
        message:
          "The dates in this column are written in two different orders (day first and month first), so they cannot be read. Write each month as 2027-01.",
      },
    };
  }

  // Used only when no date shows the order. Then each date reads in both orders, or in neither.
  const unclear = entries.findIndex((entry) => entry.asDayMonth !== entry.asMonthDay);

  let dayFirst: boolean | null = null;

  if (dayFirstSigns.length > 0) {
    dayFirst = true;
  } else if (monthFirstSigns.length > 0) {
    dayFirst = false;
  } else if (unclear === -1) {
    dayFirst = true;
  }

  if (dayFirst === null && options.unique) {
    const dayFirstRepeats = repeats(entries.flatMap((entry) => entry.asDayMonth ?? []));

    const monthFirstRepeats = repeats(entries.flatMap((entry) => entry.asMonthDay ?? []));

    if (dayFirstRepeats !== monthFirstRepeats) {
      dayFirst = monthFirstRepeats;
    }
  }

  if (dayFirst === null && options.dayFirstDefault) {
    dayFirst = true;
  }

  if (dayFirst === null) {
    const entry = entries[unclear];

    const parts = entry.parts as DateParts;

    return {
      cells,
      problem: {
        index: unclear,
        message: `"${entry.cell.trim()}" is not clear. Write ${entry.asDayMonth} if it is ${parts.first} ${MONTH_NAMES[parts.second - 1]}, or ${entry.asMonthDay} if it is ${parts.second} ${MONTH_NAMES[parts.first - 1]}.`,
      },
    };
  }

  const useDayFirst = dayFirst;

  return {
    cells: entries.map((entry) =>
      entry.parts === null ? entry.cell : (monthOf(entry.parts, useDayFirst) ?? entry.cell),
    ),
    problem: null,
  };
}
