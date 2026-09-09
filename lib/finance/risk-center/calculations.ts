import type {
  ForecastAnalyticsRow,
} from "@/lib/finance/analytics/types";

import {
  parseMonthKey,
} from "@/lib/finance/actuals/month";

import type {
  DownsideCashPeriod,
  LiquidityRiskLevel,
  LiquidityRiskReport,
  ProjectRiskPolicy,
  RiskGuardrail,
} from "@/lib/finance/risk-center/types";


type NormalizedForecastRow = {
  period:
    string;

  row:
    ForecastAnalyticsRow;
};


function normalizeForecastRows(
  rows:
    ForecastAnalyticsRow[],
  latestActualPeriod:
    string |
    null,
): NormalizedForecastRow[] {
  const normalized =
    rows.flatMap(
      (
        row,
      ) => {
        const period =
          parseMonthKey(
            row.period,
          );


        return period
          ?
            [
              {
                period,
                row,
              },
            ]
          :
            [];
      },
    );


  if (
    !latestActualPeriod
  ) {
    return normalized;
  }


  const future =
    normalized.filter(
      (
        entry,
      ) =>
        entry.period >
        latestActualPeriod,
    );


  return future.length >
    0
    ?
      future
    :
      normalized;
}


function numericValues(
  rows:
    NormalizedForecastRow[],
  getter:
    (
      row:
        ForecastAnalyticsRow,
    ) =>
      number |
      null,
): number[] {
  return rows.flatMap(
    (
      entry,
    ) => {
      const value =
        getter(
          entry.row,
        );


      return value ===
        null
        ?
          []
        :
          [
            value,
          ];
    },
  );
}


function minimum(
  values:
    number[],
): number |
  null {
  return values.length ===
    0
    ?
      null
    :
      Math.min(
        ...values,
      );
}


function maximum(
  values:
    number[],
): number |
  null {
  return values.length ===
    0
    ?
      null
    :
      Math.max(
        ...values,
      );
}


function firstPeriod(
  rows:
    NormalizedForecastRow[],
  predicate:
    (
      row:
        ForecastAnalyticsRow,
    ) =>
      boolean,
): {
  period:
    string;

  index:
    number;
} |
  null {
  const index =
    rows.findIndex(
      (
        entry,
      ) =>
        predicate(
          entry.row,
        ),
    );


  return index <
    0
    ?
      null
    :
      {
        period:
          rows[
            index
          ].period,

        index,
      };
}


function cashFlowProxy(
  row:
    ForecastAnalyticsRow,
): number {
  return (
    row.cashFlow ??
    row.netIncome ??
    row.ebitda ??
    0
  );
}


function openingCash(
  rows:
    NormalizedForecastRow[],
  latestActualCash:
    number |
    null,
): number {
  if (
    latestActualCash !==
      null
  ) {
    return latestActualCash;
  }


  const first =
    rows[
      0
    ]?.row;


  if (
    !first
  ) {
    return 0;
  }


  if (
    first.cashBalance !==
      null
  ) {
    return (
      first.cashBalance -
      cashFlowProxy(
        first,
      )
    );
  }


  return 0;
}


export function buildDownsideCashScenario(
  rows:
    ForecastAnalyticsRow[],
  policy:
    ProjectRiskPolicy,
  latestActualPeriod:
    string |
    null,
  latestActualCash:
    number |
    null,
): DownsideCashPeriod[] {
  const normalized =
    normalizeForecastRows(
      rows,
      latestActualPeriod,
    );


  let cash =
    openingCash(
      normalized,
      latestActualCash,
    );


  return normalized.map(
    (
      entry,
    ) => {
      const row =
        entry.row;


      const baselineCashFlow =
        cashFlowProxy(
          row,
        );


      const revenueLoss =
        (
          row.revenue ??
          0
        ) *
        policy.downsideRevenueShock;


      const costBase =
        (
          row.cogs ??
          0
        ) +
        (
          row.operatingExpenses ??
          0
        );


      const extraCosts =
        costBase *
        policy.downsideCostInflation;


      const stressedCashFlow =
        baselineCashFlow -
        revenueLoss -
        extraCosts;


      cash +=
        stressedCashFlow;


      return {
        period:
          entry.period,

        baselineCashFlow,

        stressedCashFlow,

        stressedCashBalance:
          cash,
      };
    },
  );
}


function riskLevel(
  score:
    number,
): LiquidityRiskLevel {
  if (
    score >=
    75
  ) {
    return "CRITICAL";
  }


  if (
    score >=
    50
  ) {
    return "HIGH";
  }


  if (
    score >=
    25
  ) {
    return "MODERATE";
  }


  return "LOW";
}


function stateForBreach(
  breached:
    boolean,
  warning:
    boolean,
): "PASS" |
  "WARNING" |
  "BREACH" {
  if (
    breached
  ) {
    return "BREACH";
  }


  return warning
    ?
      "WARNING"
    :
      "PASS";
}


export function calculateLiquidityRiskReport({
  rows,
  policy,
  latestActualPeriod,
  latestActualCash,
}: {
  rows:
    ForecastAnalyticsRow[];

  policy:
    ProjectRiskPolicy;

  latestActualPeriod:
    string |
    null;

  latestActualCash:
    number |
    null;
}): LiquidityRiskReport {
  const normalized =
    normalizeForecastRows(
      rows,
      latestActualPeriod,
    );


  const cashValues =
    numericValues(
      normalized,
      (
        row,
      ) =>
        row.cashBalance,
    );


  const minimumForecastCash =
    minimum(
      cashValues,
    );


  const exhaustion =
    firstPeriod(
      normalized,
      (
        row,
      ) =>
        row.cashBalance !==
          null &&
        row.cashBalance <=
          0,
    );


  const runwayMonths =
    exhaustion
      ?
        exhaustion.index +
        1
      :
        null;


  const minimumCashBreach =
    policy.minimumCash ===
      null
      ?
        null
      :
        firstPeriod(
          normalized,
          (
            row,
          ) =>
            row.cashBalance !==
              null &&
            row.cashBalance <
              policy.minimumCash!,
        );


  const margins =
    normalized.flatMap(
      (
        entry,
      ) => {
        const revenue =
          entry.row.revenue;


        const ebitda =
          entry.row.ebitda;


        if (
          revenue ===
            null ||
          ebitda ===
            null ||
          revenue ===
            0
        ) {
          return [];
        }


        return [
          {
            period:
              entry.period,

            margin:
              ebitda /
              revenue,
          },
        ];
      },
    );


  const minimumEbitdaMargin =
    minimum(
      margins.map(
        (
          margin,
        ) =>
          margin.margin,
      ),
    );


  const ebitdaBreach =
    policy.minimumEbitdaMargin ===
      null
      ?
        null
      :
        margins.find(
          (
            value,
          ) =>
            value.margin <
            policy.minimumEbitdaMargin!,
        ) ??
        null;


  const burns =
    normalized.flatMap(
      (
        entry,
      ) => {
        const flow =
          cashFlowProxy(
            entry.row,
          );


        return flow <
          0
          ?
            [
              {
                period:
                  entry.period,

                burn:
                  -flow,
              },
            ]
          :
            [];
      },
    );


  const maximumMonthlyBurn =
    maximum(
      burns.map(
        (
          burn,
        ) =>
          burn.burn,
      ),
    );


  const burnBreach =
    policy.maximumMonthlyBurn ===
      null
      ?
        null
      :
        burns.find(
          (
            value,
          ) =>
            value.burn >
            policy.maximumMonthlyBurn!,
        ) ??
        null;


  const downsideCash =
    buildDownsideCashScenario(
      rows,
      policy,
      latestActualPeriod,
      latestActualCash,
    );


  const minimumDownsideCash =
    minimum(
      downsideCash.map(
        (
          value,
        ) =>
          value.stressedCashBalance,
      ),
    );


  const downsideBreachIndex =
    downsideCash.findIndex(
      (
        value,
      ) =>
        value.stressedCashBalance <=
        0,
    );


  const downsideBreach =
    downsideBreachIndex <
      0
      ?
        null
      :
        downsideCash[
          downsideBreachIndex
        ];


  const runwayWarning =
    runwayMonths !==
      null &&
    runwayMonths <=
      policy.minimumRunwayMonths +
      2;


  const runwayBreach =
    runwayMonths !==
      null &&
    runwayMonths <
      policy.minimumRunwayMonths;


  const guardrails:
    RiskGuardrail[] = [
      {
        code:
          "MINIMUM_CASH",

        label:
          "Minimum cash",

        state:
          policy.minimumCash ===
            null
            ?
              "UNAVAILABLE"
            :
              stateForBreach(
                minimumCashBreach !==
                  null,
                minimumForecastCash !==
                  null &&
                minimumForecastCash <
                  policy.minimumCash *
                  1.2,
              ),

        current:
          minimumForecastCash,

        threshold:
          policy.minimumCash,

        breachPeriod:
          minimumCashBreach?.period ??
          null,

        message:
          policy.minimumCash ===
            null
            ?
              "No minimum-cash guardrail configured."
            :
            minimumCashBreach
              ?
                `Forecast cash falls below the configured floor in ${minimumCashBreach.period}.`
              :
                "Forecast cash remains above the configured floor.",
      },

      {
        code:
          "RUNWAY",

        label:
          "Cash runway",

        state:
          stateForBreach(
            runwayBreach,
            runwayWarning,
          ),

        current:
          runwayMonths,

        threshold:
          policy.minimumRunwayMonths,

        breachPeriod:
          exhaustion?.period ??
          null,

        message:
          runwayMonths ===
            null
            ?
              "No cash exhaustion is projected within the current forecast horizon."
            :
            runwayBreach
              ?
                `Cash exhaustion occurs before the ${policy.minimumRunwayMonths}-month runway guardrail.`
              :
                `Projected cash exhaustion is ${runwayMonths} months away.`,
      },

      {
        code:
          "EBITDA_MARGIN",

        label:
          "Minimum EBITDA margin",

        state:
          policy.minimumEbitdaMargin ===
            null
            ?
              "UNAVAILABLE"
            :
              stateForBreach(
                ebitdaBreach !==
                  null,
                minimumEbitdaMargin !==
                  null &&
                minimumEbitdaMargin <
                  policy.minimumEbitdaMargin +
                  0.03,
              ),

        current:
          minimumEbitdaMargin,

        threshold:
          policy.minimumEbitdaMargin,

        breachPeriod:
          ebitdaBreach?.period ??
          null,

        message:
          policy.minimumEbitdaMargin ===
            null
            ?
              "No EBITDA-margin guardrail configured."
            :
            ebitdaBreach
              ?
                `EBITDA margin falls below policy in ${ebitdaBreach.period}.`
              :
                "Forecast EBITDA margin remains within policy.",
      },

      {
        code:
          "MONTHLY_BURN",

        label:
          "Maximum monthly burn",

        state:
          policy.maximumMonthlyBurn ===
            null
            ?
              "UNAVAILABLE"
            :
              stateForBreach(
                burnBreach !==
                  null,
                maximumMonthlyBurn !==
                  null &&
                maximumMonthlyBurn >
                  policy.maximumMonthlyBurn *
                  0.85,
              ),

        current:
          maximumMonthlyBurn,

        threshold:
          policy.maximumMonthlyBurn,

        breachPeriod:
          burnBreach?.period ??
          null,

        message:
          policy.maximumMonthlyBurn ===
            null
            ?
              "No monthly-burn guardrail configured."
            :
            burnBreach
              ?
                `Monthly burn exceeds policy in ${burnBreach.period}.`
              :
                "Forecast monthly burn remains within policy.",
      },

      {
        code:
          "DOWNSIDE_LIQUIDITY",

        label:
          "Downside liquidity",

        state:
          stateForBreach(
            downsideBreach !==
              null,
            minimumDownsideCash !==
              null &&
            minimumDownsideCash <
              (
                policy.minimumCash ??
                0
              ),
          ),

        current:
          minimumDownsideCash,

        threshold:
          0,

        breachPeriod:
          downsideBreach?.period ??
          null,

        message:
          downsideBreach
            ?
              `Downside stress exhausts cash in ${downsideBreach.period}.`
            :
              "Downside stress preserves positive cash throughout the modeled horizon.",
      },
    ];


  let score =
    0;


  if (
    exhaustion
  ) {
    const months =
      exhaustion.index +
      1;


    score +=
      months <=
        3
        ?
          35
        :
        months <=
          6
          ?
            30
          :
          months <=
            12
            ?
              20
            :
              10;
  }


  if (
    minimumCashBreach
  ) {
    score +=
      20;
  }


  if (
    runwayBreach
  ) {
    score +=
      20;
  }


  if (
    ebitdaBreach
  ) {
    score +=
      15;
  }


  if (
    burnBreach
  ) {
    score +=
      10;
  }


  if (
    downsideBreach
  ) {
    score +=
      downsideBreachIndex <
        3
        ?
          20
        :
        downsideBreachIndex <
          6
          ?
            15
          :
          downsideBreachIndex <
            12
            ?
              10
            :
              5;
  }


  score =
    Math.min(
      100,
      score,
    );


  return {
    score,

    level:
      riskLevel(
        score,
      ),

    forecastPeriods:
      normalized.length,

    latestActualPeriod,

    latestActualCash,

    runwayMonths,

    firstCashExhaustionPeriod:
      exhaustion?.period ??
      null,

    firstMinimumCashBreachPeriod:
      minimumCashBreach?.period ??
      null,

    firstDownsideCashExhaustionPeriod:
      downsideBreach?.period ??
      null,

    minimumForecastCash,

    minimumDownsideCash,

    maximumMonthlyBurn,

    minimumEbitdaMargin,

    guardrails,

    downsideCash,
  };
}
