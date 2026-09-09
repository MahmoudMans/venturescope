import type {
  ExecutiveDecisionInputs,
  ExecutiveDecisionSignal,
} from "@/lib/finance/decision-center/types";


const SEVERITY_ORDER = {
  CRITICAL:
    0,

  WARNING:
    1,

  INFO:
    2,
} as const;


export function buildExecutiveDecisionSignals(
  inputs:
    ExecutiveDecisionInputs,
): ExecutiveDecisionSignal[] {
  const signals:
    ExecutiveDecisionSignal[] =
      [];


  if (
    inputs.actualPeriods ===
    0
  ) {
    signals.push({
      code:
        "NO_ACTUALS",

      category:
        "PERFORMANCE",

      severity:
        "INFO",

      title:
        "Actual performance is not yet connected",

      message:
        "No monthly Actuals are available, so variance and forecast-accuracy intelligence are incomplete.",

      actionHint:
        "Import the latest monthly Actuals and establish the operating review cadence.",

      hrefSuffix:
        "actuals",
    });
  }


  if (
    inputs.liquidityRiskLevel ===
      "CRITICAL" ||
    inputs.liquidityRiskLevel ===
      "HIGH"
  ) {
    signals.push({
      code:
        "LIQUIDITY_RISK",

      category:
        "LIQUIDITY",

      severity:
        inputs.liquidityRiskLevel ===
          "CRITICAL"
          ?
            "CRITICAL"
          :
            "WARNING",

      title:
        `${inputs.liquidityRiskLevel.toLowerCase()} liquidity risk requires management attention`,

      message:
        "The current Risk Center assessment indicates material liquidity pressure against the configured financial guardrails.",

      actionHint:
        "Review cash guardrails, downside exposure, spending commitments, and funding timing.",

      hrefSuffix:
        "risk-center",
    });
  }


  if (
    inputs.downsideCashExhaustionPeriod
  ) {
    signals.push({
      code:
        "DOWNSIDE_EXHAUSTION",

      category:
        "LIQUIDITY",

      severity:
        "CRITICAL",

      title:
        "Downside case exhausts cash",

      message:
        `The deterministic downside stress reaches cash exhaustion in ${inputs.downsideCashExhaustionPeriod}.`,

      actionHint:
        "Define contingency actions before the modeled downside cash-exhaustion period.",

      hrefSuffix:
        "risk-center",
    });
  }


  if (
    inputs.requiredCapital >
    0
  ) {
    signals.push({
      code:
        "CAPITAL_GAP",

      category:
        "CAPITAL",

      severity:
        inputs.liquidityRiskLevel ===
          "CRITICAL" ||
        inputs.downsideCashExhaustionPeriod !==
          null
          ?
            "CRITICAL"
          :
            "WARNING",

      title:
        "Additional capital is required to protect liquidity",

      message:
        "The Capital Planning model identifies a positive funding requirement to protect the configured target cash floor.",

      actionHint:
        "Compare equity, debt, and hybrid structures and establish the required funding timeline.",

      hrefSuffix:
        "capital-planning",
    });
  }


  if (
    inputs.forecastAccuracyScore !==
      null
  ) {
    if (
      inputs.forecastAccuracyScore <
      0.75
    ) {
      signals.push({
        code:
          "FORECAST_ACCURACY",

        category:
          "FORECAST",

        severity:
          "CRITICAL",

        title:
          "Forecast reliability is materially weak",

        message:
          "Historical forecast accuracy is below 75%, reducing confidence in forward planning decisions.",

        actionHint:
          "Revisit the assumptions driving the largest recurring forecast errors.",

        hrefSuffix:
          "forecast-accuracy",
      });
    }
    else if (
      inputs.forecastAccuracyScore <
      0.90
    ) {
      signals.push({
        code:
          "FORECAST_ACCURACY",

        category:
          "FORECAST",

        severity:
          "WARNING",

        title:
          "Forecast reliability should be improved",

        message:
          "Historical forecast accuracy is below 90%.",

        actionHint:
          "Review rolling forecast errors and improve the assumptions with the weakest historical reliability.",

        hrefSuffix:
          "forecast-accuracy",
      });
    }
  }


  if (
    inputs.forecastBiasCount >=
    2
  ) {
    signals.push({
      code:
        "FORECAST_BIAS",

      category:
        "FORECAST",

      severity:
        "WARNING",

      title:
        "Systematic forecast bias exists across multiple metrics",

      message:
        "At least two financial metrics show persistent directional over- or under-forecasting.",

      actionHint:
        "Review the recurring bias before approving the next planning baseline.",

      hrefSuffix:
        "forecast-accuracy",
    });
  }


  if (
    inputs.revenueVarianceRate !==
      null &&
    inputs.revenueVarianceRate <
      0
  ) {
    signals.push({
      code:
        "REVENUE_VARIANCE",

      category:
        "PERFORMANCE",

      severity:
        inputs.revenueVarianceRate <=
          -0.10
          ?
            "CRITICAL"
          :
            "WARNING",

      title:
        "Revenue is below plan",

      message:
        inputs.revenueVarianceRate <=
          -0.10
          ?
            "Actual revenue is at least 10% below the matched forecast."
          :
            "Actual revenue is below the matched forecast.",

      actionHint:
        "Identify whether the variance is caused by volume, pricing, timing, conversion, or customer retention.",

      hrefSuffix:
        "actuals",
    });
  }


  if (
    inputs.ebitdaVarianceRate !==
      null &&
    inputs.ebitdaVarianceRate <
      0
  ) {
    signals.push({
      code:
        "EBITDA_VARIANCE",

      category:
        "PERFORMANCE",

      severity:
        inputs.ebitdaVarianceRate <=
          -0.15
          ?
            "CRITICAL"
          :
            "WARNING",

      title:
        "EBITDA is below plan",

      message:
        inputs.ebitdaVarianceRate <=
          -0.15
          ?
            "Actual EBITDA is at least 15% below the matched forecast."
          :
            "Actual EBITDA is below the matched forecast.",

      actionHint:
        "Separate gross-margin pressure from operating-expense variance and assign corrective actions.",

      hrefSuffix:
        "actuals",
    });
  }


  return signals.sort(
    (
      left,
      right,
    ) =>
      SEVERITY_ORDER[
        left.severity
      ] -
      SEVERITY_ORDER[
        right.severity
      ],
  );
}
