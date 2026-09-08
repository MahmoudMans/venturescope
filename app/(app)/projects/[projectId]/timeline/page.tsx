import type {
  Metadata,
} from "next";
import {
  CalendarRange,
  Layers3,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

import {
  FinancialKpiCard,
} from "@/components/financial/financial-kpi-card";
import {
  FinancialPageHeader,
} from "@/components/financial/financial-page-header";
import {
  CreateMonthlyOverrideForm,
} from "@/components/overrides/create-monthly-override-form";
import {
  MonthlyOverrideCard,
} from "@/components/overrides/monthly-override-card";
import {
  PlanningTimeline,
  type PlanningTimelineItem,
} from "@/components/overrides/planning-timeline";
import {
  Badge,
} from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  requireUser,
} from "@/lib/auth/require-user";
import {
  getFinancialAnalysis,
} from "@/lib/finance/analysis-context";
import {
  addMonths,
  dateToMonthKey,
} from "@/lib/finance/dates";
import {
  formatCompactCurrencyValue,
} from "@/lib/finance/formatting";
import {
  formatFinancingType,
} from "@/lib/financing/formatting";
import {
  monthlyOverrideFieldLabels,
} from "@/lib/overrides/formatting";
import {
  serializeMonthlyOverride,
} from "@/lib/overrides/types";

export const metadata: Metadata = {
  title:
    "Planning timeline",
};

export default async function PlanningTimelinePage({
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
    await getFinancialAnalysis(
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

  const scenarioNameMap =
    new Map(
      project.scenarios.map(
        (
          scenario,
        ) => [
          scenario.id,
          scenario.name,
        ],
      ),
    );

  const overrideViews =
    project.monthlyOverrides.map(
      (
        override,
      ) =>
        serializeMonthlyOverride(
          override,
          override.scenarioId
            ? scenarioNameMap.get(
                override.scenarioId,
              ) ??
              "Unknown scenario"
            : "All scenarios",
        ),
    );

  const globalOverrides =
    overrideViews.filter(
      (
        override,
      ) =>
        !override.scenarioId,
    ).length;

  const scenarioOverrides =
    overrideViews.length -
    globalOverrides;

  const affectedMonths =
    new Set(
      overrideViews.map(
        (
          override,
        ) =>
          override.month,
      ),
    ).size;

  const timelineItems: PlanningTimelineItem[] =
    [
      ...project.financingEvents.map(
        (
          event,
        ) => ({
          id:
            `financing-${event.id}`,

          month:
            dateToMonthKey(
              event.month,
            ),

          kind:
            "FINANCING" as const,

          title:
            event.name,

          detail:
            `${formatFinancingType(
              event.type,
            )} · ${formatCompactCurrencyValue(
              String(
                event.amount,
              ),
              project.currency,
            )}`,

          note:
            event.type ===
            "DEBT"
              ? `${event.apr ?? 0}% APR · ${event.termMonths ?? 0} month term`
              : null,
        }),
      ),

      ...overrideViews.map(
        (
          override,
        ) => ({
          id:
            `override-${override.id}`,

          month:
            override.month,

          kind:
            "OVERRIDE" as const,

          title:
            "Monthly planning override",

          detail:
            monthlyOverrideFieldLabels(
              override.values,
            ).join(
              ", ",
            ),

          scope:
            override.scenarioName,

          note:
            override.note,
        }),
      ),
    ].sort(
      (
        left,
        right,
      ) =>
        left.month.localeCompare(
          right.month,
        ),
    );

  const baseScenario =
    project.scenarios.find(
      (
        scenario,
      ) =>
        scenario.type ===
        "BASE",
    );

  return (
    <div className="mx-auto max-w-[1500px] space-y-10 px-5 py-8 lg:px-8 lg:py-10">
      <FinancialPageHeader
        eyebrow="Model"
        title="Planning timeline"
        description="Model one-off monthly changes without changing the long-term baseline assumptions. Global overrides apply first; scenario-specific overrides take precedence."
        scenarioName="Advanced Planning"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FinancialKpiCard
          label="Monthly overrides"
          value={String(
            overrideViews.length,
          )}
          detail="Persisted one-month adjustments."
          icon={
            SlidersHorizontal
          }
        />

        <FinancialKpiCard
          label="Affected months"
          value={String(
            affectedMonths,
          )}
          detail="Distinct forecast months containing overrides."
          icon={
            CalendarRange
          }
        />

        <FinancialKpiCard
          label="Scenario-specific"
          value={String(
            scenarioOverrides,
          )}
          detail={`${globalOverrides} overrides currently apply to all scenarios.`}
          icon={
            Layers3
          }
        />

        <FinancialKpiCard
          label="Timeline events"
          value={String(
            timelineItems.length,
          )}
          detail={`${project.financingEvents.length} financing events included.`}
          icon={
            Sparkles
          }
        />
      </section>

      <CreateMonthlyOverrideForm
        projectId={
          project.id
        }
        currency={
          project.currency
        }
        revenueMode={
          project.revenueMode
        }
        projectStartMonth={
          projectStartMonth
        }
        projectEndMonth={
          projectEndMonth
        }
        scenarios={project.scenarios.map(
          (
            scenario,
          ) => ({
            id:
              scenario.id,

            name:
              scenario.name,
          }),
        )}
        defaultScenarioId={
          baseScenario
            ?.id ??
          ""
        }
      />

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">
              Monthly overrides
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Scenario-specific values override All Scenarios values for the same field and month.
            </p>
          </div>

          <Badge variant="outline">
            {
              overrideViews.length
            }{" "}
            configured
          </Badge>
        </div>

        {overrideViews.length ===
        0 ? (
          <Card className="border-dashed">
            <CardContent className="p-9 text-center">
              <SlidersHorizontal
                className="mx-auto size-8 text-muted-foreground"
                aria-hidden="true"
              />

              <div className="mt-4 font-medium">
                No monthly overrides yet
              </div>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Add one-off changes for events such as launches, annual conferences, temporary hiring, promotional months or pricing interventions.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {overrideViews.map(
              (
                override,
              ) => (
                <MonthlyOverrideCard
                  key={
                    override.id
                  }
                  projectId={
                    project.id
                  }
                  currency={
                    project.currency
                  }
                  revenueMode={
                    project.revenueMode
                  }
                  projectStartMonth={
                    projectStartMonth
                  }
                  projectEndMonth={
                    projectEndMonth
                  }
                  scenarios={project.scenarios.map(
                    (
                      scenario,
                    ) => ({
                      id:
                        scenario.id,

                      name:
                        scenario.name,
                    }),
                  )}
                  override={
                    override
                  }
                />
              ),
            )}
          </div>
        )}
      </section>

      <section className="space-y-5">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">
            Advanced timeline
          </h3>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            A chronological view of financing and month-specific operating adjustments across the forecast.
          </p>
        </div>

        <PlanningTimeline
          items={
            timelineItems
          }
        />
      </section>
    </div>
  );
}
