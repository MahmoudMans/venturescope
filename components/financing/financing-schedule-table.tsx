import { ScrollRegion } from "@/components/ui/scroll-region";
import {
  formatCurrencyValue,
  formatExpenseCurrencyValue,
  formatLongMonthKey,
} from "@/lib/finance/formatting";
import type {
  FinancingScheduleRow,
} from "@/lib/financing/schedule";

type FinancingScheduleTableProps = {
  currency: string;

  rows: FinancingScheduleRow[];
};

export function FinancingScheduleTable({
  currency,
  rows,
}: FinancingScheduleTableProps) {
  if (
    rows.length ===
    0
  ) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        No financing cash activity exists inside the current forecast horizon.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      <ScrollRegion label="Financing cash schedule">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Month
              </th>

              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Equity
              </th>

              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Debt
              </th>

              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Grant
              </th>

              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Other
              </th>

              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Interest
              </th>

              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Principal
              </th>

              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Net impact
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map(
              (
                row,
              ) => (
                <tr
                  key={
                    row.month
                  }
                  className="border-b last:border-b-0"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-medium">
                    {formatLongMonthKey(
                      row.month,
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs">
                    {formatCurrencyValue(
                      row.equityInflow,
                      currency,
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs">
                    {formatCurrencyValue(
                      row.debtInflow,
                      currency,
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs">
                    {formatCurrencyValue(
                      row.grantInflow,
                      currency,
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs">
                    {formatCurrencyValue(
                      row.otherInflow,
                      currency,
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs">
                    {formatExpenseCurrencyValue(
                      row.interestExpense,
                      currency,
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs">
                    {formatExpenseCurrencyValue(
                      row.principalRepayment,
                      currency,
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs font-semibold">
                    {formatCurrencyValue(
                      row.netFinancingCashImpact,
                      currency,
                    )}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </ScrollRegion>
    </div>
  );
}
