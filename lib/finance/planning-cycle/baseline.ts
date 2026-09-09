import {
  BASELINE_KINDS,
  type ForecastBaselineKind,
  type ForecastBaselineSnapshot,
} from "@/lib/finance/planning-cycle/types";

import type {
  ForecastAnalyticsRow,
} from "@/lib/finance/analytics/types";


type JsonRecord =
  Record<
    string,
    unknown
  >;


function isRecord(
  value:
    unknown,
): value is
  JsonRecord {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  );
}


function nullableNumber(
  value:
    unknown,
): number |
  null {
  return typeof value ===
    "number" &&
    Number.isFinite(
      value,
    )
    ?
      value
    :
      null;
}


function forecastRow(
  value:
    unknown,
): ForecastAnalyticsRow {
  if (
    !isRecord(
      value,
    ) ||
    typeof value.period !==
      "string"
  ) {
    throw new Error(
      "Invalid forecast baseline row.",
    );
  }


  return {
    period:
      value.period,

    revenue:
      nullableNumber(
        value.revenue,
      ),

    cogs:
      nullableNumber(
        value.cogs,
      ),

    grossProfit:
      nullableNumber(
        value.grossProfit,
      ),

    operatingExpenses:
      nullableNumber(
        value.operatingExpenses,
      ),

    ebitda:
      nullableNumber(
        value.ebitda,
      ),

    netIncome:
      nullableNumber(
        value.netIncome,
      ),

    cashFlow:
      nullableNumber(
        value.cashFlow,
      ),

    cashBalance:
      nullableNumber(
        value.cashBalance,
      ),

    mrr:
      nullableNumber(
        value.mrr,
      ),

    customers:
      nullableNumber(
        value.customers,
      ),

    cac:
      nullableNumber(
        value.cac,
      ),

    churnRate:
      nullableNumber(
        value.churnRate,
      ),
  };
}


export function parseBaselineKind(
  value:
    string,
): ForecastBaselineKind {
  if (
    BASELINE_KINDS.includes(
      value as
        ForecastBaselineKind,
    )
  ) {
    return value as
      ForecastBaselineKind;
  }


  throw new Error(
    "Invalid baseline kind.",
  );
}


export function parseForecastBaselineSnapshot(
  value:
    unknown,
): ForecastBaselineSnapshot {
  if (
    !isRecord(
      value,
    ) ||
    value.schemaVersion !==
      1 ||
    typeof value.capturedAt !==
      "string" ||
    !Array.isArray(
      value.rows,
    )
  ) {
    throw new Error(
      "Invalid forecast baseline snapshot.",
    );
  }


  const rows =
    value.rows.map(
      forecastRow,
    );


  if (
    rows.length ===
      0
  ) {
    throw new Error(
      "Forecast baseline contains no forecast rows.",
    );
  }


  if (
    rows.length >
    120
  ) {
    throw new Error(
      "Forecast baseline exceeds the 120-period safety limit.",
    );
  }


  return {
    schemaVersion:
      1,

    capturedAt:
      value.capturedAt,

    rows,
  };
}


export function newForecastBaselineSnapshot(
  rows:
    ForecastAnalyticsRow[],
): ForecastBaselineSnapshot {
  return parseForecastBaselineSnapshot({
    schemaVersion:
      1,

    capturedAt:
      new Date()
        .toISOString(),

    rows:
      JSON.parse(
        JSON.stringify(
          rows,
        ),
      ) as
        unknown,
  });
}
