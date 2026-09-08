import {
  Banknote,
  CalendarRange,
  Landmark,
  Percent,
  Timer,
} from "lucide-react";

import {
  FinancingEventActions,
} from "@/components/financing/financing-event-actions";
import {
  Badge,
} from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  formatCompactCurrencyValue,
  formatLongMonthKey,
} from "@/lib/finance/formatting";
import {
  financingTypeDescription,
  formatFinancingType,
} from "@/lib/financing/formatting";
import type {
  FinancingEventViewModel,
} from "@/lib/financing/types";

type FinancingEventCardProps = {
  projectId: string;

  currency: string;

  projectStartMonth: string;

  projectEndMonth: string;

  event: FinancingEventViewModel;
};

export function FinancingEventCard({
  projectId,
  currency,
  projectStartMonth,
  projectEndMonth,
  event,
}: FinancingEventCardProps) {
  const debt =
    event.type ===
    "DEBT";

  return (
    <Card className="border-border/70">
      <CardHeader className="flex flex-row items-start justify-between gap-5 space-y-0">
        <div className="flex min-w-0 gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
            {debt ? (
              <Landmark
                className="size-5"
                aria-hidden="true"
              />
            ) : (
              <Banknote
                className="size-5"
                aria-hidden="true"
              />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="font-semibold">
                {
                  event.name
                }
              </div>

              <Badge
                variant={
                  debt
                    ? "secondary"
                    : "outline"
                }
              >
                {formatFinancingType(
                  event.type,
                )}
              </Badge>
            </div>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {financingTypeDescription(
                event.type,
              )}
            </p>
          </div>
        </div>

        <FinancingEventActions
          projectId={
            projectId
          }
          currency={
            currency
          }
          projectStartMonth={
            projectStartMonth
          }
          projectEndMonth={
            projectEndMonth
          }
          event={
            event
          }
        />
      </CardHeader>

      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            icon={
              Banknote
            }
            label="Amount"
            value={formatCompactCurrencyValue(
              event.amount,
              currency,
            )}
          />

          <Metric
            icon={
              CalendarRange
            }
            label="Funding month"
            value={formatLongMonthKey(
              event.month,
            )}
          />

          {debt ? (
            <>
              <Metric
                icon={
                  Percent
                }
                label="APR"
                value={`${event.apr ?? "0"}%`}
              />

              <Metric
                icon={
                  Timer
                }
                label="Term"
                value={`${event.termMonths ?? 0} months`}
              />
            </>
          ) : null}
        </div>

        {debt ? (
          <div className="mt-4 border-t pt-4 text-xs text-muted-foreground">
            Principal repayment starts{" "}
            <span className="font-medium text-foreground">
              {formatLongMonthKey(
                event.repaymentStartMonth,
              )}
            </span>
            . Principal is repaid equally across the loan term while interest declines with outstanding principal.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon:
    React.ComponentType<{
      className?: string;
    }>;

  label: string;

  value: string;
}) {
  return (
    <div className="rounded-xl border bg-muted/20 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <Icon
          className="size-3"
          aria-hidden="true"
        />

        {
          label
        }
      </div>

      <div className="mt-2 text-sm font-medium">
        {
          value
        }
      </div>
    </div>
  );
}
