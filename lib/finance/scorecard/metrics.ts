import {
  KPI_METRIC_CODES,
  type KpiMetricCode,
} from "@/lib/finance/scorecard/types";

import {
  parseMonthKey,
} from "@/lib/finance/actuals/month";


export type KpiMetricDefinition = {
  code:
    KpiMetricCode;

  label:
    string;

  format:
    "MONEY" |
    "PERCENT" |
    "NUMBER" |
    "MONTHS";

  atRiskTolerance:
    (
      target:
        number,
    ) =>
      number;
};


export const KPI_METRICS:
  KpiMetricDefinition[] = [
    {
      code:
        "REVENUE",

      label:
        "Revenue",

      format:
        "MONEY",

      atRiskTolerance:
        (
          target,
        ) =>
          Math.abs(
            target,
          ) *
          0.10,
    },

    {
      code:
        "EBITDA_MARGIN",

      label:
        "EBITDA margin",

      format:
        "PERCENT",

      atRiskTolerance: () =>
        0.03,
    },

    {
      code:
        "CASH_BALANCE",

      label:
        "Cash balance",

      format:
        "MONEY",

      atRiskTolerance:
        (
          target,
        ) =>
          Math.abs(
            target,
          ) *
          0.10,
    },

    {
      code:
        "MRR",

      label:
        "MRR",

      format:
        "MONEY",

      atRiskTolerance:
        (
          target,
        ) =>
          Math.abs(
            target,
          ) *
          0.10,
    },

    {
      code:
        "CUSTOMERS",

      label:
        "Customers",

      format:
        "NUMBER",

      atRiskTolerance:
        (
          target,
        ) =>
          Math.max(
            1,
            Math.ceil(
              Math.abs(
                target,
              ) *
              0.10,
            ),
          ),
    },

    {
      code:
        "RUNWAY_MONTHS",

      label:
        "Runway",

      format:
        "MONTHS",

      atRiskTolerance: () =>
        2,
    },

    {
      code:
        "FORECAST_ACCURACY",

      label:
        "Forecast accuracy",

      format:
        "PERCENT",

      atRiskTolerance: () =>
        0.05,
    },
  ];


export function parseKpiMetricCode(
  value:
    string,
): KpiMetricCode {
  if (
    KPI_METRIC_CODES.includes(
      value as
        KpiMetricCode,
    )
  ) {
    return value as
      KpiMetricCode;
  }


  throw new Error(
    "Invalid KPI metric.",
  );
}


export function kpiMetricDefinition(
  code:
    KpiMetricCode,
): KpiMetricDefinition {
  const definition =
    KPI_METRICS.find(
      (
        metric,
      ) =>
        metric.code ===
        code,
    );


  if (
    !definition
  ) {
    throw new Error(
      "KPI metric definition is missing.",
    );
  }


  return definition;
}


export function parseKpiTargetPeriod(
  value:
    string,
): string {
  const parsed =
    parseMonthKey(
      value,
    );


  if (
    !parsed
  ) {
    throw new Error(
      "Target period must be a valid month.",
    );
  }


  return parsed;
}


function finiteNumber(
  raw:
    string,
  label:
    string,
): number {
  const value =
    Number(
      raw.trim(),
    );


  if (
    !Number.isFinite(
      value,
    )
  ) {
    throw new Error(
      `${label} must be a valid number.`,
    );
  }


  return value;
}


export function parseKpiTargetValue(
  metric:
    KpiMetricCode,
  raw:
    string,
): number {
  const value =
    finiteNumber(
      raw,
      "KPI target",
    );


  switch (
    metric
  ) {
    case "EBITDA_MARGIN":
      if (
        value <
          -100 ||
        value >
          100
      ) {
        throw new Error(
          "EBITDA margin target must be between -100% and 100%.",
        );
      }


      return value /
        100;


    case "FORECAST_ACCURACY":
      if (
        value <
          0 ||
        value >
          100
      ) {
        throw new Error(
          "Forecast accuracy target must be between 0% and 100%.",
        );
      }


      return value /
        100;


    case "CUSTOMERS":
      if (
        !Number.isInteger(
          value,
        ) ||
        value <
          0
      ) {
        throw new Error(
          "Customer target must be a non-negative whole number.",
        );
      }


      return value;


    case "RUNWAY_MONTHS":
      if (
        !Number.isInteger(
          value,
        ) ||
        value <
          1 ||
        value >
          120
      ) {
        throw new Error(
          "Runway target must be a whole number between 1 and 120 months.",
        );
      }


      return value;


    case "REVENUE":
    case "CASH_BALANCE":
    case "MRR":
      if (
        value <
        0
      ) {
        throw new Error(
          "Financial KPI target cannot be negative.",
        );
      }


      return value;
  }
}


export function targetValueForInput({
  metric,
  value,
}: {
  metric:
    KpiMetricCode;

  value:
    number;
}): number {
  return (
    metric ===
      "EBITDA_MARGIN" ||
    metric ===
      "FORECAST_ACCURACY"
  )
    ?
      value *
      100
    :
      value;
}
