import Link from "next/link";

import {
  Button,
} from "@/components/ui/button";
import { ScrollRegion } from "@/components/ui/scroll-region";
import {
  formatCompactCurrencyValue,
  formatCustomerValue,
  formatLongMonthKey,
  formatRunway,
} from "@/lib/finance/formatting";
import type {
  ScenarioComparisonItem,
} from "@/lib/finance/types";

export function ScenarioComparisonTable({
  projectId,
  comparison,
  currency,
}: {
  projectId: string;

  comparison: ScenarioComparisonItem[];

  currency: string;
}) {
  const showCustomers =
    comparison.some(
      (
        item,
      ) =>
        item.endingCustomers !==
        null,
    );

  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      <ScrollRegion label="Scenario comparison">
        <table className="w-max min-w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="sticky left-0 z-10 min-w-52 border-r bg-muted/95 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
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
            <ComparisonRow
              label="First-year revenue"
              values={comparison.map(
                (
                  item,
                ) =>
                  formatCompactCurrencyValue(
                    item.firstYearRevenue,
                    currency,
                  ),
              )}
            />

            <ComparisonRow
              label="First-year EBITDA"
              values={comparison.map(
                (
                  item,
                ) =>
                  formatCompactCurrencyValue(
                    item.firstYearEbitda,
                    currency,
                  ),
              )}
            />

            <ComparisonRow
              label="Ending cash"
              values={comparison.map(
                (
                  item,
                ) =>
                  formatCompactCurrencyValue(
                    item.endingCash,
                    currency,
                  ),
              )}
            />

            <ComparisonRow
              label="Ending MRR"
              values={comparison.map(
                (
                  item,
                ) =>
                  formatCompactCurrencyValue(
                    item.endingMrr,
                    currency,
                  ),
              )}
            />

            {showCustomers ? (
              <ComparisonRow
                label="Ending customers"
                values={comparison.map(
                  (
                    item,
                  ) =>
                    formatCustomerValue(
                      item.endingCustomers,
                    ),
                )}
              />
            ) : null}

            <ComparisonRow
              label="Runway"
              values={comparison.map(
                (
                  item,
                ) =>
                  formatRunway(
                    item.runway,
                  ),
              )}
            />

            <ComparisonRow
              label="Sustained break-even"
              values={comparison.map(
                (
                  item,
                ) =>
                  item.sustainedBreakEvenMonth
                    ? formatLongMonthKey(
                        item.sustainedBreakEvenMonth,
                      )
                    : "Not reached",
              )}
            />

            <tr className="border-t bg-muted/20">
              <th className="sticky left-0 z-10 border-r bg-muted/80 px-4 py-3 text-left font-medium">
                Open dashboard
              </th>

              {comparison.map(
                (
                  item,
                ) => (
                  <td
                    key={`open-${item.scenarioId ?? item.scenarioName}`}
                    className="border-r px-4 py-3 text-right last:border-r-0"
                  >
                    {item.scenarioId ? (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                      >
                        <Link
                          href={`/projects/${projectId}/overview?scenario=${encodeURIComponent(
                            item.scenarioId,
                          )}`}
                        >
                          Open
                        </Link>
                      </Button>
                    ) : (
                      "—"
                    )}
                  </td>
                ),
              )}
            </tr>
          </tbody>
        </table>
      </ScrollRegion>
    </div>
  );
}

function ComparisonRow({
  label,
  values,
}: {
  label: string;

  values: string[];
}) {
  return (
    <tr className="border-b last:border-b-0">
      <th className="sticky left-0 z-10 border-r bg-background px-4 py-3 text-left font-medium">
        {
          label
        }
      </th>

      {values.map(
        (
          value,
          index,
        ) => (
          <td
            key={`${label}-${index}`}
            className="border-r px-4 py-3 text-right font-mono text-xs tabular-nums last:border-r-0"
          >
            {
              value
            }
          </td>
        ),
      )}
    </tr>
  );
}
