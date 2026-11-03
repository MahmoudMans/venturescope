import type {
  Metadata,
} from "next";
import {
  ArrowDownToLine,
  Banknote,
  CircleDollarSign,
  Gauge,
  Landmark,
  ReceiptText,
} from "lucide-react";

import {
  CreateFinancingEventForm,
} from "@/components/financing/create-financing-event-form";
import {
  FinancingEventCard,
} from "@/components/financing/financing-event-card";
import {
  FinancingScheduleTable,
} from "@/components/financing/financing-schedule-table";
import {
  FinancialKpiCard,
} from "@/components/financial/financial-kpi-card";
import {
  FinancialPageHeader,
} from "@/components/financial/financial-page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  requireUser,
} from "@/lib/auth/require-user";
import {
  getBaseFinancialAnalysis,
} from "@/lib/finance/analysis-context";
import {
  addMonths,
  dateToMonthKey,
} from "@/lib/finance/dates";
import {
  formatCompactCurrencyValue,
  formatRunway,
  formatRunwayDetail,
} from "@/lib/finance/formatting";
import {
  buildFinancingSchedule,
  summarizeFinancingSchedule,
} from "@/lib/financing/schedule";
import {
  serializeFinancingEvent,
} from "@/lib/financing/types";

export const metadata: Metadata = {
  title:
    "Financing",
};

export default async function FinancingPage({
  params,
}: {
  params: Promise<{
    projectId: string;
  }>;
}) {
  const {
    projectId,
  } = await params;

  const user =
    await requireUser();

  const analysis =
    await getBaseFinancialAnalysis(
      user.id,
      projectId,
    );

  const project =
    analysis.project;

  const projectStartMonth =
    dateToMonthKey(
      project.startMonth,
    );

  const projectEndMonth =
    addMonths(
      projectStartMonth,
      project.horizonMonths -
        1,
    );

  const events =
    project.financingEvents.map(
      serializeFinancingEvent,
    );

  const schedule =
    analysis.ready
      ? buildFinancingSchedule(
          analysis.forecast
            .months,
        )
      : [];

  const scheduleSummary =
    summarizeFinancingSchedule(
      schedule,
    );

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <FinancialPageHeader
        eyebrow="Model"
        title="Financing"
        description="Model equity rounds, debt, grants and other financing events. Financing changes cash flow but never operating revenue."
        scenarioName="Base Case"
      />

      {analysis.ready ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 min-[1800px]:grid-cols-6">
          <FinancialKpiCard
            label="Total financing"
            value={formatCompactCurrencyValue(
              scheduleSummary.totalInflow,
              project.currency,
            )}
            detail="Total external cash inflow during the forecast."
            icon={
              CircleDollarSign
            }
          />

          <FinancialKpiCard
            label="Equity"
            value={formatCompactCurrencyValue(
              scheduleSummary.totalEquityInflow,
              project.currency,
            )}
            detail="Equity financing inside the forecast horizon."
            icon={
              Banknote
            }
          />

          <FinancialKpiCard
            label="Debt raised"
            value={formatCompactCurrencyValue(
              scheduleSummary.totalDebtInflow,
              project.currency,
            )}
            detail="Loan principal received."
            icon={
              Landmark
            }
          />

          <FinancialKpiCard
            label="Interest"
            value={formatCompactCurrencyValue(
              scheduleSummary.totalInterestExpense,
              project.currency,
            )}
            detail="Debt interest recognized during the forecast."
            icon={
              ReceiptText
            }
          />

          <FinancialKpiCard
            label="Principal repaid"
            value={formatCompactCurrencyValue(
              scheduleSummary.totalPrincipalRepayment,
              project.currency,
            )}
            detail="Debt principal repayments occurring inside the forecast."
            icon={
              ArrowDownToLine
            }
          />

          <FinancialKpiCard
            label="Runway"
            value={formatRunway(
              analysis.forecast
                .metrics
                .runway,
            )}
            detail={formatRunwayDetail(
              analysis.forecast
                .metrics
                .runway,
            )}
            icon={
              Gauge
            }
          />
        </section>
      ) : (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>
              Financing can be configured now
            </CardTitle>

            <CardDescription className="max-w-3xl leading-6">
              Your financing events will be stored immediately. Complete General, Revenue and Expense assumptions to activate the calculated debt schedule, cash impact and runway metrics.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <CreateFinancingEventForm
        projectId={
          project.id
        }
        currency={
          project.currency
        }
        projectStartMonth={
          projectStartMonth
        }
        projectEndMonth={
          projectEndMonth
        }
      />

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">
            Financing events
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            {
              events.length
            }{" "}
            {events.length ===
            1
              ? "event"
              : "events"}{" "}
            configured.
          </p>
        </div>

        {events.length ===
        0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-muted">
                <Banknote
                  className="size-5"
                  aria-hidden="true"
                />
              </div>

              <div className="mt-4 font-medium">
                No financing events yet
              </div>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
                Add a funding round, loan, grant or other financing event to understand how external capital changes the company&apos;s cash runway.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {events.map(
              (
                event,
              ) => (
                <FinancingEventCard
                  key={
                    event.id
                  }
                  projectId={
                    project.id
                  }
                  currency={
                    project.currency
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
              ),
            )}
          </div>
        )}
      </section>

      {analysis.ready ? (
        <section className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">
              Financing schedule
            </h3>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              Only months with a financing inflow, debt interest or principal repayment are shown. Debt interest affects P&amp;L and cash; principal repayment affects cash only.
            </p>
          </div>

          <FinancingScheduleTable
            currency={
              project.currency
            }
            rows={
              schedule
            }
          />
        </section>
      ) : null}
    </div>
  );
}
