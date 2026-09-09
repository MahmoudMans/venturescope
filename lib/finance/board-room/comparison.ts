import type {
  ExecutiveReviewComparison,
  ExecutiveReviewSnapshot,
  ReviewComparisonMetric,
} from "@/lib/finance/board-room/types";


function comparison(
  frozen:
    number |
    null,
  live:
    number |
    null,
): ReviewComparisonMetric {
  return {
    frozen,

    live,

    delta:
      frozen ===
        null ||
      live ===
        null
        ?
          null
        :
          live -
          frozen,
  };
}


export function compareExecutiveReview(
  frozen:
    ExecutiveReviewSnapshot,
  live:
    ExecutiveReviewSnapshot,
): ExecutiveReviewComparison {
  return {
    revenueVarianceRate:
      comparison(
        frozen.kpis
          .revenueVarianceRate,
        live.kpis
          .revenueVarianceRate,
      ),

    ebitdaVarianceRate:
      comparison(
        frozen.kpis
          .ebitdaVarianceRate,
        live.kpis
          .ebitdaVarianceRate,
      ),

    forecastAccuracyScore:
      comparison(
        frozen.kpis
          .forecastAccuracyScore,
        live.kpis
          .forecastAccuracyScore,
      ),

    liquidityRiskScore:
      comparison(
        frozen.kpis
          .liquidityRiskScore,
        live.kpis
          .liquidityRiskScore,
      ),

    capitalNeed:
      comparison(
        frozen.kpis
          .capitalNeed,
        live.kpis
          .capitalNeed,
      ),

    openActions:
      comparison(
        frozen.actions
          .open,
        live.actions
          .open,
      ),
  };
}
