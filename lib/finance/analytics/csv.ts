import type {
  ForecastAnalyticsRow,
} from "@/lib/finance/analytics/types";


type Metric =
  Exclude<
    keyof ForecastAnalyticsRow,
    "period"
  >;


const PERIOD_ALIASES = [
  "period",
  "month",
  "date",
  "forecastmonth",
  "forecastperiod",
];


const METRIC_ALIASES:
  Record<
    Metric,
    string[]
  > = {
    revenue: [
      "revenue",
      "totalrevenue",
      "sales",
    ],

    cogs: [
      "cogs",
      "costofgoodssold",
      "costofsales",
    ],

    grossProfit: [
      "grossprofit",
    ],

    operatingExpenses: [
      "operatingexpenses",
      "operatingexpense",
      "opex",
      "totalexpenses",
      "expenses",
    ],

    ebitda: [
      "ebitda",
    ],

    netIncome: [
      "netincome",
      "profit",
      "netprofit",
    ],

    cashFlow: [
      "cashflow",
      "netcashflow",
      "netcashmovement",
      "cashmovement",
      "freecashflow",
    ],

    cashBalance: [
      "cashbalance",
      "endingcash",
      "endingcashbalance",
      "cash",
    ],

    mrr: [
      "mrr",
      "monthlyrecurringrevenue",
    ],

    customers: [
      "customers",
      "activecustomers",
      "endingcustomers",
    ],

    cac: [
      "cac",
      "customeracquisitioncost",
    ],

    churnRate: [
      "churn",
      "churnrate",
      "monthlychurn",
      "monthlychurnrate",
    ],
  };


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


export function parseCsvTable(
  value:
    string,
  delimiter:
    string =
      ",",
): string[][] {
  const rows:
    string[][] =
      [];


  let row:
    string[] =
      [];

  let field =
    "";

  let quoted =
    false;


  for (
    let index =
      0;
    index <
      value.length;
    index +=
      1
  ) {
    const character =
      value[
        index
      ];


    if (
      quoted
    ) {
      if (
        character ===
        '"'
      ) {
        if (
          value[
            index +
            1
          ] ===
          '"'
        ) {
          field +=
            '"';

          index +=
            1;
        }
        else {
          quoted =
            false;
        }
      }
      else {
        field +=
          character;
      }


      continue;
    }


    if (
      character ===
      '"'
    ) {
      quoted =
        true;

      continue;
    }


    if (
      character ===
      delimiter
    ) {
      row.push(
        field,
      );

      field =
        "";

      continue;
    }


    if (
      character ===
      "\n"
    ) {
      row.push(
        field,
      );

      rows.push(
        row,
      );

      row =
        [];

      field =
        "";

      continue;
    }


    if (
      character ===
      "\r"
    ) {
      continue;
    }


    field +=
      character;
  }


  if (
    field.length >
      0 ||
    row.length >
      0
  ) {
    row.push(
      field,
    );

    rows.push(
      row,
    );
  }


  return rows;
}


function numericValue(
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


  const percentage =
    trimmed.includes(
      "%",
    );


  const negative =
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
        /[%€£$¥₺₽₹₫₩₦₱₴₸₡₲₵₭₮₼₾₿]/g,
        "",
      )
      .replace(
        /\s/g,
        "",
      )
      .replace(
        /,/g,
        "");


  const parsed =
    Number(
      normalized,
    );


  if (
    !Number.isFinite(
      parsed,
    )
  ) {
    return null;
  }


  const signed =
    negative
      ?
        -parsed
      :
        parsed;


  return percentage
    ?
      signed /
        100
    :
      signed;
}


function aliasIndex(
  headers:
    string[],
  aliases:
    string[],
): number {
  for (
    const alias
    of aliases
  ) {
    const exact =
      headers.indexOf(
        alias,
      );


    if (
      exact >=
      0
    ) {
      return exact;
    }
  }


  return -1;
}


function headerScore(
  row:
    string[],
): number {
  const headers =
    row.map(
      normalizeHeader,
    );


  let score =
    PERIOD_ALIASES.some(
      (
        alias,
      ) =>
        headers.includes(
          alias,
        ),
    )
      ?
        2
      :
        0;


  for (
    const aliases
    of Object.values(
      METRIC_ALIASES,
    )
  ) {
    if (
      aliases.some(
        (
          alias,
        ) =>
          headers.includes(
            alias,
          ),
      )
    ) {
      score +=
        1;
    }
  }


  return score;
}


export function normalizeForecastCsv(
  csv:
    string,
): ForecastAnalyticsRow[] {
  const table =
    parseCsvTable(
      csv,
    );


  if (
    table.length <
    2
  ) {
    return [];
  }


  let headerIndex =
    -1;

  let bestScore =
    0;


  table.forEach(
    (
      row,
      index,
    ) => {
      const score =
        headerScore(
          row,
        );


      if (
        score >
        bestScore
      ) {
        bestScore =
          score;

        headerIndex =
          index;
      }
    },
  );


  if (
    headerIndex <
      0 ||
    bestScore <
      3
  ) {
    return [];
  }


  const headers =
    table[
      headerIndex
    ].map(
      normalizeHeader,
    );


  const periodIndex =
    aliasIndex(
      headers,
      PERIOD_ALIASES,
    );


  const indexes =
    Object.fromEntries(
      Object.entries(
        METRIC_ALIASES,
      ).map(
        (
          [
            metric,
            aliases,
          ],
        ) => [
          metric,
          aliasIndex(
            headers,
            aliases,
          ),
        ],
      ),
    ) as
      Record<
        Metric,
        number
      >;


  const result:
    ForecastAnalyticsRow[] =
      [];


  for (
    const row
    of table.slice(
      headerIndex +
        1,
    )
  ) {
    const values =
      {} as
        Record<
          Metric,
          number |
          null
        >;


    let populatedMetrics =
      0;


    for (
      const metric
      of Object.keys(
        indexes,
      ) as
        Metric[]
    ) {
      const index =
        indexes[
          metric
        ];


      const numeric =
        index >=
          0
          ?
            numericValue(
              row[
                index
              ],
            )
          :
            null;


      values[
        metric
      ] =
        numeric;


      if (
        numeric !==
        null
      ) {
        populatedMetrics +=
          1;
      }
    }


    if (
      populatedMetrics <
      1
    ) {
      continue;
    }


    const period =
      periodIndex >=
        0
        ?
          (
            row[
              periodIndex
            ]?.trim() ??
            ""
          )
        :
          `Month ${result.length + 1}`;


    result.push({
      period:
        period ||
        `Month ${result.length + 1}`,

      ...values,
    });
  }


  return result;
}
