import type {
  PortfolioAttentionLevel,
  PortfolioCurrencySummary,
  PortfolioExecutiveDashboard,
  PortfolioProjectAnalytics,
  PortfolioProjectRow,
  PortfolioRiskDistribution,
} from "@/lib/finance/portfolio-dashboard/types";


function attentionLevel(
  score:
    number,
): PortfolioAttentionLevel {
  if (
    score >=
    70
  ) {
    return "CRITICAL";
  }


  if (
    score >=
    40
  ) {
    return "REVIEW";
  }


  if (
    score >=
    20
  ) {
    return "MONITOR";
  }


  return "STABLE";
}


function riskAttentionPoints(
  level:
    string |
    null,
): number {
  switch (
    level
  ) {
    case "CRITICAL":
      return 45;


    case "HIGH":
      return 35;


    case "MODERATE":
      return 20;


    case "LOW":
      return 0;


    default:
      return 10;
  }
}


export function portfolioAttentionScore(
  analytics:
    PortfolioProjectAnalytics,
): number {
  const {
    project,
    liveSnapshot,
    scorecardSummary,
    forecastAvailable,
  } =
    analytics;


  let score =
    riskAttentionPoints(
      liveSnapshot?.kpis
        .liquidityRiskLevel ??
      null,
    );


  if (
    liveSnapshot?.kpis
      .capitalNeed &&
    liveSnapshot.kpis
      .capitalNeed >
    0
  ) {
    score +=
      20;
  }


  score +=
    Math.min(
      20,
      (
        liveSnapshot?.actions
          .criticalOpen ??
        0
      ) *
      10,
    );


  score +=
    Math.min(
      10,
      (
        scorecardSummary
          ?.offTrack ??
        0
      ) *
      5,
    );


  if (
    project.latestPeriodCloseStatus ===
    "OPEN"
  ) {
    score +=
      5;
  }


  if (
    liveSnapshot?.kpis
      .forecastAccuracyScore !==
      null &&
    liveSnapshot?.kpis
      .forecastAccuracyScore !==
      undefined &&
    liveSnapshot.kpis
      .forecastAccuracyScore <
      0.80
  ) {
    score +=
      10;
  }


  if (
    !forecastAvailable
  ) {
    score +=
      10;
  }


  return Math.min(
    100,
    score,
  );
}


function projectRow(
  analytics:
    PortfolioProjectAnalytics,
): PortfolioProjectRow {
  const score =
    portfolioAttentionScore(
      analytics,
    );


  const snapshot =
    analytics.liveSnapshot;


  return {
    id:
      analytics.project.id,

    name:
      analytics.project.name,

    industry:
      analytics.project.industry,

    currency:
      analytics.project.currency,

    role:
      analytics.project.role,

    isCurrentProject:
      analytics.project.isCurrentProject,

    latestActualPeriod:
      analytics.project.latestActualPeriod,

    latestActualCash:
      analytics.project.latestActualCash,

    latestPeriodCloseStatus:
      analytics.project.latestPeriodCloseStatus,

    forecastAvailable:
      analytics.forecastAvailable,

    liquidityRiskLevel:
      snapshot?.kpis
        .liquidityRiskLevel ??
      null,

    liquidityRiskScore:
      snapshot?.kpis
        .liquidityRiskScore ??
      null,

    capitalNeed:
      snapshot?.kpis
        .capitalNeed ??
      null,

    forecastAccuracy:
      snapshot?.kpis
        .forecastAccuracyScore ??
      null,

    openActions:
      snapshot?.actions
        .open ??
      0,

    criticalOpenActions:
      snapshot?.actions
        .criticalOpen ??
      0,

    overdueActions:
      snapshot?.actions
        .overdue ??
      0,

    offTrackTargets:
      analytics.scorecardSummary
        ?.offTrack ??
      0,

    atRiskTargets:
      analytics.scorecardSummary
        ?.atRisk ??
      0,

    attentionScore:
      score,

    attentionLevel:
      attentionLevel(
        score,
      ),
  };
}


function currencySummaries(
  analytics:
    PortfolioProjectAnalytics[],
): PortfolioCurrencySummary[] {
  const currencies =
    new Map<
      string,
      PortfolioCurrencySummary
    >();


  for (
    const item
    of analytics
  ) {
    const currency =
      item.project.currency;


    const existing =
      currencies.get(
        currency,
      ) ??
      {
        currency,

        projectCount:
          0,

        projectsWithForecast:
          0,

        projectsWithActualCash:
          0,

        latestActualCash:
          0,

        capitalNeed:
          0,
      };


    existing.projectCount +=
      1;


    if (
      item.forecastAvailable
    ) {
      existing.projectsWithForecast +=
        1;
    }


    if (
      item.project.latestActualCash !==
      null
    ) {
      existing.projectsWithActualCash +=
        1;

      existing.latestActualCash +=
        item.project.latestActualCash;
    }


    if (
      item.liveSnapshot
    ) {
      existing.capitalNeed +=
        item.liveSnapshot
          .kpis
          .capitalNeed;
    }


    currencies.set(
      currency,
      existing,
    );
  }


  return [
    ...currencies.values(),
  ].sort(
    (
      left,
      right,
    ) =>
      left.currency.localeCompare(
        right.currency,
      ),
  );
}


function riskDistribution(
  rows:
    PortfolioProjectRow[],
): PortfolioRiskDistribution {
  return {
    critical:
      rows.filter(
        (
          row,
        ) =>
          row.liquidityRiskLevel ===
          "CRITICAL",
      ).length,

    high:
      rows.filter(
        (
          row,
        ) =>
          row.liquidityRiskLevel ===
          "HIGH",
      ).length,

    moderate:
      rows.filter(
        (
          row,
        ) =>
          row.liquidityRiskLevel ===
          "MODERATE",
      ).length,

    low:
      rows.filter(
        (
          row,
        ) =>
          row.liquidityRiskLevel ===
          "LOW",
      ).length,

    unavailable:
      rows.filter(
        (
          row,
        ) =>
          row.liquidityRiskLevel ===
          null,
      ).length,
  };
}


export function buildPortfolioExecutiveDashboard(
  analytics:
    PortfolioProjectAnalytics[],
): PortfolioExecutiveDashboard {
  const rows =
    analytics
      .map(
        projectRow,
      )
      .sort(
        (
          left,
          right,
        ) => {
          const attention =
            right.attentionScore -
            left.attentionScore;


          if (
            attention !==
            0
          ) {
            return attention;
          }


          const risk =
            (
              right.liquidityRiskScore ??
              -1
            ) -
            (
              left.liquidityRiskScore ??
              -1
            );


          if (
            risk !==
            0
          ) {
            return risk;
          }


          return left.name.localeCompare(
            right.name,
          );
        },
      );


  const accuracyValues =
    rows.flatMap(
      (
        row,
      ) =>
        row.forecastAccuracy ===
          null
          ?
            []
          :
            [
              row.forecastAccuracy,
            ],
    );


  return {
    rows,

    currencies:
      currencySummaries(
        analytics,
      ),

    summary: {
      loadedProjects:
        rows.length,

      forecastReady:
        rows.filter(
          (
            row,
          ) =>
            row.forecastAvailable,
        ).length,

      forecastUnavailable:
        rows.filter(
          (
            row,
          ) =>
            !row.forecastAvailable,
        ).length,

      criticalHighRisk:
        rows.filter(
          (
            row,
          ) =>
            row.liquidityRiskLevel ===
              "CRITICAL" ||
            row.liquidityRiskLevel ===
              "HIGH",
        ).length,

      openCriticalActions:
        rows.reduce(
          (
            total,
            row,
          ) =>
            total +
            row.criticalOpenActions,
          0,
        ),

      offTrackTargets:
        rows.reduce(
          (
            total,
            row,
          ) =>
            total +
            row.offTrackTargets,
          0,
        ),

      openFinancialPeriods:
        rows.filter(
          (
            row,
          ) =>
            row.latestPeriodCloseStatus ===
            "OPEN",
        ).length,

      averageForecastAccuracy:
        accuracyValues.length ===
          0
          ?
            null
          :
            accuracyValues.reduce(
              (
                total,
                value,
              ) =>
                total +
                value,
              0,
            ) /
            accuracyValues.length,

      riskDistribution:
        riskDistribution(
          rows,
        ),
    },
  };
}
