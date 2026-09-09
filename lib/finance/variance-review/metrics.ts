import {
  parseMonthKey,
} from "@/lib/finance/actuals/month";

import {
  VARIANCE_CAUSE_CODES,
  VARIANCE_COMMENTARY_STATUSES,
  VARIANCE_METRIC_CODES,
  VARIANCE_NATURES,
  type VarianceCauseCode,
  type VarianceCommentaryStatus,
  type VarianceMetricCode,
  type VarianceNature,
} from "@/lib/finance/variance-review/types";


export type VarianceMetricDefinition = {
  code:
    VarianceMetricCode;

  label:
    string;

  format:
    "MONEY" |
    "NUMBER";

  favorableDirection:
    "HIGHER" |
    "LOWER";
};


export const VARIANCE_METRICS:
  VarianceMetricDefinition[] = [
    {
      code:
        "REVENUE",

      label:
        "Revenue",

      format:
        "MONEY",

      favorableDirection:
        "HIGHER",
    },

    {
      code:
        "COGS",

      label:
        "COGS",

      format:
        "MONEY",

      favorableDirection:
        "LOWER",
    },

    {
      code:
        "OPERATING_EXPENSES",

      label:
        "Operating expenses",

      format:
        "MONEY",

      favorableDirection:
        "LOWER",
    },

    {
      code:
        "EBITDA",

      label:
        "EBITDA",

      format:
        "MONEY",

      favorableDirection:
        "HIGHER",
    },

    {
      code:
        "NET_INCOME",

      label:
        "Net income",

      format:
        "MONEY",

      favorableDirection:
        "HIGHER",
    },

    {
      code:
        "CASH_FLOW",

      label:
        "Cash flow",

      format:
        "MONEY",

      favorableDirection:
        "HIGHER",
    },

    {
      code:
        "CASH_BALANCE",

      label:
        "Cash balance",

      format:
        "MONEY",

      favorableDirection:
        "HIGHER",
    },

    {
      code:
        "MRR",

      label:
        "MRR",

      format:
        "MONEY",

      favorableDirection:
        "HIGHER",
    },

    {
      code:
        "CUSTOMERS",

      label:
        "Customers",

      format:
        "NUMBER",

      favorableDirection:
        "HIGHER",
    },
  ];


export function varianceMetricDefinition(
  code:
    VarianceMetricCode,
): VarianceMetricDefinition {
  const definition =
    VARIANCE_METRICS.find(
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
      "Variance metric definition is missing.",
    );
  }


  return definition;
}


export function parseVarianceMetricCode(
  value:
    string,
): VarianceMetricCode {
  if (
    VARIANCE_METRIC_CODES.includes(
      value as
        VarianceMetricCode,
    )
  ) {
    return value as
      VarianceMetricCode;
  }


  throw new Error(
    "Invalid variance metric.",
  );
}


export function parseVarianceCauseCode(
  value:
    string,
): VarianceCauseCode {
  if (
    VARIANCE_CAUSE_CODES.includes(
      value as
        VarianceCauseCode,
    )
  ) {
    return value as
      VarianceCauseCode;
  }


  throw new Error(
    "Invalid variance root cause.",
  );
}


export function parseVarianceNature(
  value:
    string,
): VarianceNature {
  if (
    VARIANCE_NATURES.includes(
      value as
        VarianceNature,
    )
  ) {
    return value as
      VarianceNature;
  }


  throw new Error(
    "Invalid variance nature.",
  );
}


export function parseVarianceCommentaryStatus(
  value:
    string,
): VarianceCommentaryStatus {
  if (
    VARIANCE_COMMENTARY_STATUSES.includes(
      value as
        VarianceCommentaryStatus,
    )
  ) {
    return value as
      VarianceCommentaryStatus;
  }


  throw new Error(
    "Invalid variance review status.",
  );
}


export function parseVariancePeriod(
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
      "Variance period must be a valid month.",
    );
  }


  return parsed;
}


export function parseRecoveryPeriod(
  value:
    string,
): string |
  null {
  if (
    !value.trim()
  ) {
    return null;
  }


  return parseVariancePeriod(
    value,
  );
}
