import type {
  ProjectRiskPolicy,
} from "@/lib/finance/risk-center/types";


export const DEFAULT_PROJECT_RISK_POLICY:
  ProjectRiskPolicy = {
    minimumCash:
      0,

    minimumRunwayMonths:
      6,

    minimumEbitdaMargin:
      null,

    maximumMonthlyBurn:
      null,

    downsideRevenueShock:
      0.20,

    downsideCostInflation:
      0.10,
  };


function optionalNumber(
  raw:
    string,
  label:
    string,
): number |
  null {
  const trimmed =
    raw.trim();


  if (
    !trimmed
  ) {
    return null;
  }


  const parsed =
    Number(
      trimmed,
    );


  if (
    !Number.isFinite(
      parsed,
    )
  ) {
    throw new Error(
      `${label} must be a valid number.`,
    );
  }


  return parsed;
}


function requiredNumber(
  raw:
    string,
  label:
    string,
): number {
  const parsed =
    optionalNumber(
      raw,
      label,
    );


  if (
    parsed ===
    null
  ) {
    throw new Error(
      `${label} is required.`,
    );
  }


  return parsed;
}


function percentage(
  raw:
    string,
  label:
    string,
  minimum:
    number,
  maximum:
    number,
): number {
  const parsed =
    requiredNumber(
      raw,
      label,
    );


  if (
    parsed <
      minimum ||
    parsed >
      maximum
  ) {
    throw new Error(
      `${label} must be between ${minimum}% and ${maximum}%.`,
    );
  }


  return parsed /
    100;
}


export function parseProjectRiskPolicy({
  minimumCash,
  minimumRunwayMonths,
  minimumEbitdaMarginPercent,
  maximumMonthlyBurn,
  downsideRevenueShockPercent,
  downsideCostInflationPercent,
}: {
  minimumCash:
    string;

  minimumRunwayMonths:
    string;

  minimumEbitdaMarginPercent:
    string;

  maximumMonthlyBurn:
    string;

  downsideRevenueShockPercent:
    string;

  downsideCostInflationPercent:
    string;
}): ProjectRiskPolicy {
  const cash =
    optionalNumber(
      minimumCash,
      "Minimum cash",
    );


  if (
    cash !==
      null &&
    cash <
      0
  ) {
    throw new Error(
      "Minimum cash cannot be negative.",
    );
  }


  const runway =
    requiredNumber(
      minimumRunwayMonths,
      "Minimum runway",
    );


  if (
    !Number.isInteger(
      runway,
    ) ||
    runway <
      1 ||
    runway >
      60
  ) {
    throw new Error(
      "Minimum runway must be a whole number between 1 and 60 months.",
    );
  }


  const rawMargin =
    optionalNumber(
      minimumEbitdaMarginPercent,
      "Minimum EBITDA margin",
    );


  if (
    rawMargin !==
      null &&
    (
      rawMargin <
        -100 ||
      rawMargin >
        100
    )
  ) {
    throw new Error(
      "Minimum EBITDA margin must be between -100% and 100%.",
    );
  }


  const burn =
    optionalNumber(
      maximumMonthlyBurn,
      "Maximum monthly burn",
    );


  if (
    burn !==
      null &&
    burn <
      0
  ) {
    throw new Error(
      "Maximum monthly burn cannot be negative.",
    );
  }


  return {
    minimumCash:
      cash,

    minimumRunwayMonths:
      runway,

    minimumEbitdaMargin:
      rawMargin ===
        null
        ?
          null
        :
          rawMargin /
          100,

    maximumMonthlyBurn:
      burn,

    downsideRevenueShock:
      percentage(
        downsideRevenueShockPercent,
        "Revenue downside shock",
        0,
        90,
      ),

    downsideCostInflation:
      percentage(
        downsideCostInflationPercent,
        "Cost inflation",
        0,
        100,
      ),
  };
}
