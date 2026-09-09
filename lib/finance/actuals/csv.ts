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


const MAX_IMPORT_BYTES =
  512 *
  1024;


const MAX_IMPORT_ROWS =
  120;


const HEADER_ALIASES = {
  period: [
    "month",
    "period",
    "date",
  ],

  revenue: [
    "revenue",
    "sales",
  ],

  cogs: [
    "cogs",
    "costofgoodssold",
    "costofsales",
  ],

  operatingExpenses: [
    "operatingexpenses",
    "opex",
    "expenses",
  ],

  ebitda: [
    "ebitda",
  ],

  netIncome: [
    "netincome",
    "netprofit",
  ],

  cashFlow: [
    "cashflow",
    "netcashflow",
  ],

  cashBalance: [
    "cashbalance",
    "endingcash",
  ],

  mrr: [
    "mrr",
    "monthlyrecurringrevenue",
  ],

  customers: [
    "customers",
    "activecustomers",
  ],
} as const;


function normalizeHeader(
  value:
    string,
): string {
  return value
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]/g,
      "",
    );
}


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
    trimmed ===
      "-" ||
    trimmed.toLowerCase() ===
      "n/a"
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


  const table =
    parseCsvTable(
      csv,
    );


  if (
    table.length <
    2
  ) {
    throw new Error(
      "Actuals CSV contains no data rows.",
    );
  }


  const headerIndex =
    table.findIndex(
      (
        row,
      ) => {
        const headers =
          row.map(
            normalizeHeader,
          );


        return (
          findColumn(
            headers,
            HEADER_ALIASES.period,
          ) >=
            0 &&
          Object.entries(
            HEADER_ALIASES,
          ).some(
            (
              [
                name,
                aliases,
              ],
            ) =>
              name !==
                "period" &&
              findColumn(
                headers,
                aliases,
              ) >=
                0,
          )
        );
      },
    );


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
      normalizeHeader,
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


  const output:
    ActualImportRow[] =
      [];


  const seen =
    new Set<
      string
    >();


  for (
    const row
    of table.slice(
      headerIndex +
        1,
    )
  ) {
    const rawPeriod =
      row[
        periodColumn
      ]?.trim();


    if (
      !rawPeriod
    ) {
      continue;
    }


    const period =
      parseActualMonth(
        rawPeriod,
      );


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
