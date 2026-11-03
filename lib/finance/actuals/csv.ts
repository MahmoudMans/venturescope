import {
  COLUMN_TITLES,
  normalizeTitle,
} from "@/lib/data-import/headers";

import {
  isNoNumber,
  readImportNumber,
} from "@/lib/data-import/number";

import {
  countUntitled,
  describeUntitled,
  dropSepLine,
  findTable,
  titleRules,
} from "@/lib/data-import/table";

import {
  parseCsvTable,
} from "@/lib/finance/analytics/csv";

import type {
  ActualImportRow,
} from "@/lib/finance/actuals/types";

import {
  formatMonthKey,
  parseMonthStartUtc,
} from "@/lib/finance/actuals/month";

import {
  readMonthColumn,
} from "@/lib/finance/actuals/month-column";


const MAX_IMPORT_BYTES =
  512 *
  1024;


const MAX_IMPORT_ROWS =
  120;


/**
 * The titles that are read for each column. The list is shared with the Data Import Center
 * (lib/data-import/headers.ts), so both read "Mois", "Chiffre d'affaires" or "Net income" the same way.
 */
const HEADER_ALIASES =
  COLUMN_TITLES.ACTUALS;


/**
 * The row of titles is the first row with a month column and one column of numbers. Lines above
 * it, such as a report name or a "sep=;" line, are not used.
 */
const TITLE_RULES =
  titleRules(
    "ACTUALS",
    [
      "period",
    ],
  );


function findColumn(
  headers:
    string[],
  aliases:
    readonly string[],
): number {
  for (
    const alias
    of aliases
  ) {
    const index =
      headers.indexOf(
        alias,
      );


    if (
      index >=
      0
    ) {
      return index;
    }
  }


  return -1;
}


function parseFinancialNumber(
  raw:
    string |
    undefined,
): number |
  null {
  if (
    raw ===
      undefined
  ) {
    return null;
  }


  const trimmed =
    raw.trim();


  if (
    !trimmed ||
    isNoNumber(
      trimmed,
    )
  ) {
    return null;
  }


  const parenthesized =
    /^\(.*\)$/.test(
      trimmed,
    );


  const normalized =
    trimmed
      .replace(
        /[()]/g,
        "",
      )
      .replace(
        /[$€£¥₹₽₺₩₦₱₴₸₡₲₵₭₮₼₾₿]/g,
        "",
      )
      .replace(
        /,/g,
        "",
      )
      .replace(
        /\s/g,
        "");


  const parsed =
    Number(
      normalized,
    );


  if (
    !Number.isFinite(
      parsed,
    ) ||
    Math.abs(
      parsed,
    ) >
      1e15
  ) {
    throw new Error(
      `Invalid financial number: ${raw}`,
    );
  }


  return parenthesized
    ?
      -parsed
    :
      parsed;
}


/**
 * Reads the number cells of one row with the rules for spreadsheet numbers (see
 * lib/data-import/number.ts), so the cells hold plain number texts afterwards. In a file with
 * semicolons a comma is a decimal mark: a number that is not clear is refused, and a comma is never
 * removed. The row that was read from the file does not change. A column that is not in the file
 * has the number -1 and so no cell: it is skipped.
 */
function readNumberCells(
  row:
    string[],
  columns:
    number[],
  decimalComma:
    boolean,
): string[] {
  const cells =
    [
      ...row,
    ];


  for (
    const column
    of columns
  ) {
    const cell =
      cells[
        column
      ];


    if (
      cell ===
        undefined
    ) {
      continue;
    }


    const read =
      readImportNumber(
        cell.trim(),
        decimalComma,
      );


    if (
      read.ok ===
        false
    ) {
      throw new Error(
        read.message,
      );
    }


    if (
      decimalComma &&
      read.text.includes(
        ",",
      )
    ) {
      throw new Error(
        `Invalid financial number: ${cell}`,
      );
    }


    cells[
      column
    ] =
      read.text;
  }


  return cells;
}


export function parseActualMonth(
  raw:
    string,
): Date {
  const parsed =
    parseMonthStartUtc(
      raw,
    );


  if (
    !parsed
  ) {
    throw new Error(
      `Invalid actuals month: ${raw}`,
    );
  }


  return parsed;
}


export function actualPeriodKey(
  date:
    Date,
): string {
  return formatMonthKey(
    date,
  );
}


export function parseActualsCsv(
  csv:
    string,
): ActualImportRow[] {
  if (
    Buffer.byteLength(
      csv,
      "utf8",
    ) >
    MAX_IMPORT_BYTES
  ) {
    throw new Error(
      "Actuals CSV exceeds the 512 KB import limit.",
    );
  }


  const found =
    findTable(
      csv,
      (
        candidate,
      ) =>
        dropSepLine(
          csv,
          parseCsvTable(
            csv,
            candidate,
          ),
        ),
      TITLE_RULES,
    );


  const delimiter =
    found.delimiter;


  const decimalComma =
    delimiter ===
      ";";


  const table =
    found.rows;


  if (
    table.length <
    2
  ) {
    throw new Error(
      "Actuals CSV contains no data rows.",
    );
  }


  const headerIndex =
    found.complete
      ?
        found.index
      :
        -1;


  if (
    headerIndex <
    0
  ) {
    throw new Error(
      "Actuals CSV must contain Month/Period and at least one financial metric column.",
    );
  }


  const headers =
    table[
      headerIndex
    ].map(
      normalizeTitle,
    );


  const periodColumn =
    findColumn(
      headers,
      HEADER_ALIASES.period,
    );


  const columns = {
    revenue:
      findColumn(
        headers,
        HEADER_ALIASES.revenue,
      ),

    cogs:
      findColumn(
        headers,
        HEADER_ALIASES.cogs,
      ),

    operatingExpenses:
      findColumn(
        headers,
        HEADER_ALIASES.operatingExpenses,
      ),

    ebitda:
      findColumn(
        headers,
        HEADER_ALIASES.ebitda,
      ),

    netIncome:
      findColumn(
        headers,
        HEADER_ALIASES.netIncome,
      ),

    cashFlow:
      findColumn(
        headers,
        HEADER_ALIASES.cashFlow,
      ),

    cashBalance:
      findColumn(
        headers,
        HEADER_ALIASES.cashBalance,
      ),

    mrr:
      findColumn(
        headers,
        HEADER_ALIASES.mrr,
      ),

    customers:
      findColumn(
        headers,
        HEADER_ALIASES.customers,
      ),
  };


  const dataRows =
    table.slice(
      headerIndex +
        1,
    );


  const months =
    readMonthColumn(
      dataRows.map(
        (
          row,
        ) =>
          row[
            periodColumn
          ] ??
          "",
      ),
      {
        unique:
          true,

        dayFirstDefault:
          decimalComma,
      },
    );


  if (
    months.problem
  ) {
    throw new Error(
      months.problem.message,
    );
  }


  const numberColumns =
    Object.values(
      columns,
    );


  const output:
    ActualImportRow[] =
      [];


  const seen =
    new Set<
      string
    >();


  for (
    let rowIndex =
      0;
    rowIndex <
      dataRows.length;
    rowIndex +=
      1
  ) {
    const sheetRow =
      headerIndex +
      rowIndex +
      2;


    const rawPeriod =
      months.cells[
        rowIndex
      ]?.trim();


    if (
      !rawPeriod
    ) {
      if (
        dataRows[
          rowIndex
        ].some(
          (
            cell,
          ) =>
            cell.trim() !==
            "",
        )
      ) {
        throw new Error(
          `Row ${sheetRow}: This row has values but no month. Add the month, or delete the row.`,
        );
      }


      continue;
    }


    let period:
      Date;


    try {
      period =
        parseActualMonth(
          rawPeriod,
        );
    }
    catch (
      error
    ) {
      throw new Error(
        `${
          error instanceof Error
            ?
              error.message
            :
              "Invalid actuals month"
        } (row ${sheetRow}). If it is a total row, remove it.`,
      );
    }


    const untitled =
      countUntitled(
        table[
          headerIndex
        ],
        dataRows[
          rowIndex
        ],
      );


    if (
      untitled >
      0
    ) {
      throw new Error(
        `Row ${sheetRow}: ${describeUntitled(
          untitled,
        )}`,
      );
    }


    const key =
      actualPeriodKey(
        period,
      );


    if (
      seen.has(
        key,
      )
    ) {
      throw new Error(
        `Actuals CSV contains duplicate month ${key}.`,
      );
    }


    seen.add(
      key,
    );


    const row =
      readNumberCells(
        dataRows[
          rowIndex
        ],
        numberColumns,
        decimalComma,
      );


    const financial = {
      revenue:
        columns.revenue >=
          0
          ?
            parseFinancialNumber(
              row[
                columns.revenue
              ],
            )
          :
            null,

      cogs:
        columns.cogs >=
          0
          ?
            parseFinancialNumber(
              row[
                columns.cogs
              ],
            )
          :
            null,

      operatingExpenses:
        columns.operatingExpenses >=
          0
          ?
            parseFinancialNumber(
              row[
                columns.operatingExpenses
              ],
            )
          :
            null,

      ebitda:
        columns.ebitda >=
          0
          ?
            parseFinancialNumber(
              row[
                columns.ebitda
              ],
            )
          :
            null,

      netIncome:
        columns.netIncome >=
          0
          ?
            parseFinancialNumber(
              row[
                columns.netIncome
              ],
            )
          :
            null,

      cashFlow:
        columns.cashFlow >=
          0
          ?
            parseFinancialNumber(
              row[
                columns.cashFlow
              ],
            )
          :
            null,

      cashBalance:
        columns.cashBalance >=
          0
          ?
            parseFinancialNumber(
              row[
                columns.cashBalance
              ],
            )
          :
            null,

      mrr:
        columns.mrr >=
          0
          ?
            parseFinancialNumber(
              row[
                columns.mrr
              ],
            )
          :
            null,

      customers:
        columns.customers >=
          0
          ?
            parseFinancialNumber(
              row[
                columns.customers
              ],
            )
          :
            null,
    };


    if (
      financial.customers !==
        null &&
      (
        !Number.isInteger(
          financial.customers,
        ) ||
        financial.customers <
          0
      )
    ) {
      throw new Error(
        `Customers must be a non-negative integer for ${key}.`,
      );
    }


    if (
      Object.values(
        financial,
      ).every(
        (
          value,
        ) =>
          value ===
          null,
      )
    ) {
      continue;
    }


    output.push({
      period,
      ...financial,
    });
  }


  if (
    output.length ===
    0
  ) {
    throw new Error(
      "Actuals CSV contains no usable financial rows.",
    );
  }


  if (
    output.length >
    MAX_IMPORT_ROWS
  ) {
    throw new Error(
      `Actuals CSV exceeds the ${MAX_IMPORT_ROWS}-month import limit.`,
    );
  }


  return output.sort(
    (
      left,
      right,
    ) =>
      left.period.getTime() -
      right.period.getTime(),
  );
}
