import {
  formatCompactCurrencyValue,
  formatLongMonthKey,
  formatPercentageValue,
  formatRunway,
} from "@/lib/finance/formatting";
import type {
  ReadyReportContext,
} from "@/lib/reports/context";

export function buildExecutiveSummary(
  context: ReadyReportContext,
): string[] {
  const {
    forecast,
  } = context;

  const result: string[] =
    [];

  result.push(
    `${forecast.projectName} is forecast to generate ${formatCompactCurrencyValue(
      forecast.metrics
        .firstYearRevenue,
      forecast.currency,
    )} of revenue in the first forecast calendar year under the ${forecast.scenario.name} scenario.`,
  );

  result.push(
    `First-year EBITDA is ${formatCompactCurrencyValue(
      forecast.metrics
        .firstYearEbitda,
      forecast.currency,
    )}, while the full-horizon EBITDA margin is ${formatPercentageValue(
      forecast.metrics
        .ebitdaMarginPercentage,
    )}.`,
  );

  result.push(
    `Projected ending cash is ${formatCompactCurrencyValue(
      forecast.metrics
        .endingCash,
      forecast.currency,
    )}, with runway reported as ${formatRunway(
      forecast.metrics
        .runway,
    )}.`,
  );

  if (
    forecast.metrics
      .breakEven
      .sustainedBreakEvenMonth
  ) {
    result.push(
      `Sustained EBITDA break-even is reached in ${formatLongMonthKey(
        forecast.metrics
          .breakEven
          .sustainedBreakEvenMonth,
      )}.`,
    );
  } else {
    result.push(
      "Sustained EBITDA break-even is not reached during the current forecast horizon.",
    );
  }

  result.push(
    `Ending monthly recurring revenue is ${formatCompactCurrencyValue(
      forecast.metrics
        .endingMrr,
      forecast.currency,
    )}, equivalent to ${formatCompactCurrencyValue(
      forecast.metrics
        .endingArr,
      forecast.currency,
    )} annualized recurring revenue.`,
  );

  return result;
}
