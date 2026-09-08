import {
  CalendarRange,
  SlidersHorizontal,
} from "lucide-react";

import {
  MonthlyOverrideActions,
} from "@/components/overrides/monthly-override-actions";
import {
  Badge,
} from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  formatLongMonthKey,
} from "@/lib/finance/formatting";
import type {
  RevenueMode,
} from "@/lib/finance/types";
import {
  monthlyOverrideFieldLabels,
} from "@/lib/overrides/formatting";
import type {
  MonthlyOverrideViewModel,
} from "@/lib/overrides/types";

export function MonthlyOverrideCard({
  projectId,
  currency,
  revenueMode,
  projectStartMonth,
  projectEndMonth,
  scenarios,
  override,
}: {
  projectId: string;

  currency: string;

  revenueMode: RevenueMode;

  projectStartMonth: string;

  projectEndMonth: string;

  scenarios: Array<{
    id: string;

    name: string;
  }>;

  override: MonthlyOverrideViewModel;
}) {
  const fields =
    monthlyOverrideFieldLabels(
      override.values,
    );

  return (
    <Card className="border-border/70">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="flex min-w-0 gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
            <SlidersHorizontal
              className="size-4"
              aria-hidden="true"
            />
          </div>

          <div>
            <div className="font-semibold">
              {formatLongMonthKey(
                override.month,
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline">
                {
                  override.scenarioName
                }
              </Badge>

              {fields.map(
                (
                  field,
                ) => (
                  <Badge
                    key={
                      field
                    }
                    variant="secondary"
                  >
                    {
                      field
                    }
                  </Badge>
                ),
              )}
            </div>
          </div>
        </div>

        <MonthlyOverrideActions
          projectId={
            projectId
          }
          currency={
            currency
          }
          revenueMode={
            revenueMode
          }
          projectStartMonth={
            projectStartMonth
          }
          projectEndMonth={
            projectEndMonth
          }
          scenarios={
            scenarios
          }
          override={
            override
          }
        />
      </CardHeader>

      <CardContent>
        {override.note ? (
          <div className="flex gap-3 rounded-lg border bg-muted/20 p-3 text-sm">
            <CalendarRange
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />

            <span>
              {
                override.note
              }
            </span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No planning note attached.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
