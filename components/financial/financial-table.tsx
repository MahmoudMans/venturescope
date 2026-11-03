import { ScrollRegion } from "@/components/ui/scroll-region";
import {
  cn,
} from "@/lib/utils";

export type FinancialTableColumn = {
  key: string;

  label: string;

  detail?: string;
};

export type FinancialTableRow = {
  label: string;

  values: string[];

  kind?:
    | "normal"
    | "subtotal"
    | "total"
    | "metric";

  indent?: boolean;
};

type FinancialTableProps = {
  caption: string;

  columns: FinancialTableColumn[];

  rows: FinancialTableRow[];
};

export function FinancialTable({
  caption,
  columns,
  rows,
}: FinancialTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      <ScrollRegion label={caption}>
        <table className="w-max min-w-full border-collapse text-sm">
          <caption className="sr-only">
            {caption}
          </caption>

          <thead>
            <tr className="border-b bg-muted/40">
              <th
                scope="col"
                className="sticky left-0 z-20 min-w-56 border-r bg-muted/95 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground backdrop-blur"
              >
                Metric
              </th>

              {columns.map(
                (
                  column,
                ) => (
                  <th
                    key={
                      column.key
                    }
                    scope="col"
                    className="min-w-32 border-r px-4 py-3 text-right last:border-r-0"
                  >
                    <div className="text-xs font-semibold">
                      {
                        column.label
                      }
                    </div>

                    {column.detail ? (
                      <div className="mt-1 text-[10px] font-normal text-muted-foreground">
                        {
                          column.detail
                        }
                      </div>
                    ) : null}
                  </th>
                ),
              )}
            </tr>
          </thead>

          <tbody>
            {rows.map(
              (
                row,
                rowIndex,
              ) => {
                const kind =
                  row.kind ??
                  "normal";

                const rowClass =
                  kind ===
                  "total"
                    ? "border-t-2 bg-muted/40 font-semibold"
                    : kind ===
                        "subtotal"
                      ? "border-t bg-muted/20 font-medium"
                      : kind ===
                          "metric"
                        ? "bg-muted/10 text-muted-foreground"
                        : "";

                const stickyClass =
                  kind ===
                  "total"
                    ? "bg-muted"
                    : kind ===
                        "subtotal"
                      ? "bg-muted/80"
                      : kind ===
                          "metric"
                        ? "bg-muted/50"
                        : "bg-background";

                return (
                  <tr
                    key={`${row.label}-${rowIndex}`}
                    className={cn(
                      "border-b last:border-b-0",
                      rowClass,
                    )}
                  >
                    <th
                      scope="row"
                      className={cn(
                        "sticky left-0 z-10 min-w-56 border-r px-4 py-3 text-left font-medium backdrop-blur",
                        stickyClass,
                        row.indent &&
                          "pl-8 font-normal text-muted-foreground",
                      )}
                    >
                      {
                        row.label
                      }
                    </th>

                    {row.values.map(
                      (
                        value,
                        valueIndex,
                      ) => (
                        <td
                          key={`${row.label}-${valueIndex}`}
                          className="min-w-32 border-r px-4 py-3 text-right font-mono text-xs tabular-nums last:border-r-0"
                        >
                          {
                            value
                          }
                        </td>
                      ),
                    )}
                  </tr>
                );
              },
            )}
          </tbody>
        </table>
      </ScrollRegion>
    </div>
  );
}
