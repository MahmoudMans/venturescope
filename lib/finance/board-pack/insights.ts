import type {
  BoardPackExecutiveSummary,
  BoardPackInsight,
  BoardPackIntelligenceInput,
} from "@/lib/finance/board-pack/types";


const SEVERITY_ORDER = {
  CRITICAL:
    0,

  WARNING:
    1,

  INFO:
    2,
} as const;


export function buildBoardPackExecutiveSummary({
  reportPeriod,
  liveSnapshot,
  scorecard,
  varianceReview,
  periodRegister,
  actions,
}: BoardPackIntelligenceInput): BoardPackExecutiveSummary {
  const insights:
    BoardPackInsight[] =
      [];


  if (
    liveSnapshot.kpis
      .liquidityRiskLevel ===
      "CRITICAL" ||
    liveSnapshot.kpis
      .liquidityRiskLevel ===
      "HIGH"
  ) {
    insights.push({
      code:
        "LIQUIDITY",

      severity:
        liveSnapshot.kpis
          .liquidityRiskLevel ===
          "CRITICAL"
          ?
            "CRITICAL"
          :
            "WARNING",

      title:
        `${liveSnapshot.kpis.liquidityRiskLevel.toLowerCase()} liquidity risk`,

      detail:
        `Liquidity risk score is ${liveSnapshot.kpis.liquidityRiskScore}/100.`,

      managementResponse:
        "Review liquidity guardrails, downside exposure, cash preservation measures, and funding timing.",
    });
  }


  if (
    liveSnapshot.kpis
      .capitalNeed >
    0
  ) {
    insights.push({
      code:
        "CAPITAL_NEED",

      severity:
        liveSnapshot.kpis
          .downsideCashExhaustionPeriod
          ?
            "CRITICAL"
          :
            "WARNING",

      title:
        "Downside case requires additional capital",

      detail:
        "The current downside case has a positive modeled funding requirement.",

      managementResponse:
        "Confirm funding strategy, decision deadlines, and contingency actions.",
    });
  }


  if (
    scorecard.summary
      .offTrack >
    0
  ) {
    insights.push({
      code:
        "OFF_TRACK_TARGETS",

      severity:
        scorecard.summary
          .offTrack >=
          3
          ?
            "CRITICAL"
          :
            "WARNING",

      title:
        `${scorecard.summary.offTrack} management target${scorecard.summary.offTrack === 1 ? "" : "s"} off track`,

      detail:
        `The management scorecard contains ${scorecard.summary.offTrack} OFF_TRACK target${scorecard.summary.offTrack === 1 ? "" : "s"}.`,

      managementResponse:
        "Confirm owners, recovery actions, and whether the operating plan needs adjustment.",
    });
  }


  if (
    varianceReview.summary
      .materialUnexplained >
    0
  ) {
    insights.push({
      code:
        "UNEXPLAINED_VARIANCE",

      severity:
        varianceReview.summary
          .materialUnexplained >=
          3
          ?
            "CRITICAL"
          :
            "WARNING",

      title:
        `${varianceReview.summary.materialUnexplained} material variance${varianceReview.summary.materialUnexplained === 1 ? "" : "s"} without management explanation`,

      detail:
        "Material Actual-versus-Forecast movements remain without structured management commentary.",

      managementResponse:
        "Assign root causes and corrective actions before the management review is finalized.",
    });
  }


  const unresolvedCriticalActions =
    actions.filter(
      (
        action,
      ) =>
        action.priority ===
          "CRITICAL" &&
        action.status !==
          "DONE" &&
        action.status !==
          "DISMISSED",
    );


  if (
    unresolvedCriticalActions.length >
    0
  ) {
    insights.push({
      code:
        "CRITICAL_ACTIONS",

      severity:
        "CRITICAL",

      title:
        `${unresolvedCriticalActions.length} critical management action${unresolvedCriticalActions.length === 1 ? "" : "s"} unresolved`,

      detail:
        "Critical actions remain open, in progress, or blocked.",

      managementResponse:
        "Review accountability, blockers, deadlines, and escalation requirements.",
    });
  }


  const reportPeriodRow =
    periodRegister.rows.find(
      (
        row,
      ) =>
        row.periodKey ===
        reportPeriod,
    );


  if (
    reportPeriodRow &&
    reportPeriodRow.status ===
      "OPEN"
  ) {
    insights.push({
      code:
        "OPEN_FINANCIAL_PERIOD",

      severity:
        "WARNING",

      title:
        `${reportPeriod} financial period is still open`,

      detail:
        "The reporting period has Actuals but has not yet been financially closed.",

      managementResponse:
        "Complete the financial-close review before treating the period as final historical performance.",
    });
  }


  if (
    liveSnapshot.kpis
      .forecastAccuracyScore !==
      null &&
    liveSnapshot.kpis
      .forecastAccuracyScore <
      0.80
  ) {
    insights.push({
      code:
        "FORECAST_ACCURACY",

      severity:
        "WARNING",

      title:
        "Forecast reliability is below 80%",

      detail:
        "Historical forecast accuracy is materially below the desired planning-confidence level.",

      managementResponse:
        "Review recurring forecast errors and challenge the assumptions driving persistent bias.",
    });
  }


  if (
    insights.length ===
    0
  ) {
    insights.push({
      code:
        "NO_MAJOR_EXCEPTION",

      severity:
        "INFO",

      title:
        "No major management exception detected",

      detail:
        "The current board-pack authorities do not identify a critical management exception.",

      managementResponse:
        "Continue monitoring performance, forecast reliability, liquidity, and execution commitments.",
    });
  }


  insights.sort(
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


  return {
    insights,

    critical:
      insights.filter(
        (
          insight,
        ) =>
          insight.severity ===
          "CRITICAL",
      ).length,

    warnings:
      insights.filter(
        (
          insight,
        ) =>
          insight.severity ===
          "WARNING",
      ).length,
  };
}
