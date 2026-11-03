import { ScrollRegion } from "@/components/ui/scroll-region";
import {
  formatCompactCurrencyValue,
  formatLongMonthKey,
  formatRunway,
} from "@/lib/finance/formatting";
import type {
  ScenarioComparisonItem,
} from "@/lib/finance/types";

export function DemoScenarioTable({
  comparison,
  currency,
}: {
  comparison: ScenarioComparisonItem[];

  currency: string;
}) {
  const rows = [
    {
      label:
        "First-year revenue",

      values:
        comparison.map(
          (
            item,
          ) =>
            formatCompactCurrencyValue(
              item.firstYearRevenue,
              currency,
            ),
        ),
    },

    {
      label:
        "First-year EBITDA",

      values:
        comparison.map(
          (
            item,
          ) =>
            formatCompactCurrencyValue(
              item.firstYearEbitda,
              currency,
            ),
        ),
    },

    {
      label:
        "Ending cash",

      values:
        comparison.map(
          (
            item,
          ) =>
            formatCompactCurrencyValue(
              item.endingCash,
              currency,
            ),
        ),
    },

    {
      label:
        "Ending MRR",

      values:
        comparison.map(
          (
            item,
          ) =>
            formatCompactCurrencyValue(
              item.endingMrr,
              currency,
            ),
        ),
    },

    {
      label:
        "Runway",

      values:
        comparison.map(
          (
            item,
          ) =>
            formatRunway(
              item.runway,
            ),
        ),
    },

    {
      label:
        "Break-even",

      values:
        comparison.map(
          (
            item,
          ) =>
            item.sustainedBreakEvenMonth
              ? formatLongMonthKey(
                  item.sustainedBreakEvenMonth,
                )
              : "Not reached",
        ),
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      <ScrollRegion label="Scenario comparison">
        <table className="w-max min-w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="sticky left-0 z-10 min-w-52 border-r bg-muted/95 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground">
                Metric
              </th>

              {comparison.map(
                (
                  item,
                ) => (
                  <th
                    key={
                      item.scenarioId ??
                      item.scenarioName
                    }
                    className="min-w-44 border-r px-4 py-3 text-right last:border-r-0"
                  >
                    <div className="font-semibold">
                      {
                        item.scenarioName
                      }
                    </div>

                    <div className="mt-1 text-[10px] font-normal text-muted-foreground">
                      {
                        item.scenarioType
                      }
                    </div>
                  </th>
                ),
              )}
            </tr>
          </thead>

          <tbody>
            {rows.map(
              (
                row,
              ) => (
                <tr
                  key={
                    row.label
                  }
                  className="border-b last:border-b-0"
                >
                  <th className="sticky left-0 z-10 border-r bg-background px-4 py-3 text-left font-medium">
                    {
                      row.label
                    }
                  </th>

                  {row.values.map(
                    (
                      value,
                      index,
                    ) => (
                      <td
                        key={`${row.label}-${index}`}
                        className="border-r px-4 py-3 text-right font-mono text-xs tabular-nums last:border-r-0"
                      >
                        {
                          value
                        }
                      </td>
                    ),
                  )}
                </tr>
              ),
            )}
          </tbody>
        </table>
      </ScrollRegion>
    </div>
  );
}
