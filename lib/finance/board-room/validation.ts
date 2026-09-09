import {
  DECISION_SOURCE_CODES,
  type DecisionSignalCategory,
  type DecisionSignalSeverity,
  type DecisionSourceCode,
  type ExecutiveDecisionSignal,
} from "@/lib/finance/decision-center/types";

import type {
  ExecutiveReviewSnapshot,
} from "@/lib/finance/board-room/types";

import {
  parseMonthKey,
} from "@/lib/finance/actuals/month";


type JsonRecord =
  Record<
    string,
    unknown
  >;


const RISK_LEVELS = [
  "LOW",
  "MODERATE",
  "HIGH",
  "CRITICAL",
] as const;


const SIGNAL_SEVERITIES:
  DecisionSignalSeverity[] = [
    "INFO",
    "WARNING",
    "CRITICAL",
  ];


const SIGNAL_CATEGORIES:
  DecisionSignalCategory[] = [
    "PERFORMANCE",
    "FORECAST",
    "LIQUIDITY",
    "CAPITAL",
  ];


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


function requiredString(
  value:
    unknown,
  field:
    string,
): string {
  if (
    typeof value !==
      "string"
  ) {
    throw new Error(
      `Invalid ${field}.`,
    );
  }


  return value;
}


function requiredNumber(
  value:
    unknown,
  field:
    string,
): number {
  if (
    typeof value !==
      "number" ||
    !Number.isFinite(
      value,
    )
  ) {
    throw new Error(
      `Invalid ${field}.`,
    );
  }


  return value;
}


function nullableNumber(
  value:
    unknown,
  field:
    string,
): number |
  null {
  if (
    value ===
    null
  ) {
    return null;
  }


  return requiredNumber(
    value,
    field,
  );
}


function signal(
  value:
    unknown,
): ExecutiveDecisionSignal {
  if (
    !isRecord(
      value,
    )
  ) {
    throw new Error(
      "Invalid executive review signal.",
    );
  }


  const code =
    requiredString(
      value.code,
      "signal code",
    ) as
      DecisionSourceCode;


  if (
    !DECISION_SOURCE_CODES.includes(
      code,
    )
  ) {
    throw new Error(
      "Invalid executive signal code.",
    );
  }


  const category =
    requiredString(
      value.category,
      "signal category",
    ) as
      DecisionSignalCategory;


  if (
    !SIGNAL_CATEGORIES.includes(
      category,
    )
  ) {
    throw new Error(
      "Invalid executive signal category.",
    );
  }


  const severity =
    requiredString(
      value.severity,
      "signal severity",
    ) as
      DecisionSignalSeverity;


  if (
    !SIGNAL_SEVERITIES.includes(
      severity,
    )
  ) {
    throw new Error(
      "Invalid executive signal severity.",
    );
  }


  return {
    code,

    category,

    severity,

    title:
      requiredString(
        value.title,
        "signal title",
      ),

    message:
      requiredString(
        value.message,
        "signal message",
      ),

    actionHint:
      requiredString(
        value.actionHint,
        "signal action hint",
      ),

    hrefSuffix:
      requiredString(
        value.hrefSuffix,
        "signal source link",
      ),
  };
}


export function parseExecutiveReviewPeriod(
  raw:
    string,
): string {
  const parsed =
    parseMonthKey(
      raw,
    );


  if (
    !parsed
  ) {
    throw new Error(
      "Review period must be a valid month.",
    );
  }


  return parsed;
}


export function parseExecutiveReviewSnapshot(
  value:
    unknown,
): ExecutiveReviewSnapshot {
  if (
    !isRecord(
      value,
    ) ||
    value.schemaVersion !==
      1 ||
    typeof value.capturedAt !==
      "string" ||
    !isRecord(
      value.kpis,
    ) ||
    !isRecord(
      value.actions,
    ) ||
    !Array.isArray(
      value.signals,
    )
  ) {
    throw new Error(
      "Invalid executive review snapshot.",
    );
  }


  const riskLevel =
    requiredString(
      value.kpis
        .liquidityRiskLevel,
      "liquidity risk level",
    ) as
      typeof RISK_LEVELS[
        number
      ];


  if (
    !RISK_LEVELS.includes(
      riskLevel,
    )
  ) {
    throw new Error(
      "Invalid executive review risk level.",
    );
  }


  return {
    schemaVersion:
      1,

    capturedAt:
      value.capturedAt,

    kpis: {
      actualPeriods:
        requiredNumber(
          value.kpis
            .actualPeriods,
          "actual periods",
        ),

      matchedPeriods:
        requiredNumber(
          value.kpis
            .matchedPeriods,
          "matched periods",
        ),

      revenueVarianceRate:
        nullableNumber(
          value.kpis
            .revenueVarianceRate,
          "revenue variance",
        ),

      ebitdaVarianceRate:
        nullableNumber(
          value.kpis
            .ebitdaVarianceRate,
          "EBITDA variance",
        ),

      forecastAccuracyScore:
        nullableNumber(
          value.kpis
            .forecastAccuracyScore,
          "forecast accuracy",
        ),

      forecastWape:
        nullableNumber(
          value.kpis
            .forecastWape,
          "forecast WAPE",
        ),

      liquidityRiskLevel:
        riskLevel,

      liquidityRiskScore:
        requiredNumber(
          value.kpis
            .liquidityRiskScore,
          "liquidity risk score",
        ),

      minimumForecastCash:
        nullableNumber(
          value.kpis
            .minimumForecastCash,
          "minimum forecast cash",
        ),

      minimumDownsideCash:
        nullableNumber(
          value.kpis
            .minimumDownsideCash,
          "minimum downside cash",
        ),

      downsideCashExhaustionPeriod:
        value.kpis
          .downsideCashExhaustionPeriod ===
          null
          ?
            null
          :
            requiredString(
              value.kpis
                .downsideCashExhaustionPeriod,
              "downside exhaustion period",
            ),

      capitalNeed:
        requiredNumber(
          value.kpis
            .capitalNeed,
          "capital need",
        ),
    },

    actions: {
      open:
        requiredNumber(
          value.actions
            .open,
          "open actions",
        ),

      criticalOpen:
        requiredNumber(
          value.actions
            .criticalOpen,
          "critical open actions",
        ),

      overdue:
        requiredNumber(
          value.actions
            .overdue,
          "overdue actions",
        ),

      done:
        requiredNumber(
          value.actions
            .done,
          "done actions",
        ),
    },

    signals:
      value.signals.map(
        signal,
      ),
  };
}
