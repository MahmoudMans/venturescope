import type {
  Metadata,
} from "next";
import {
  ArrowRight,
  Building2,
  CalendarRange,
  CheckCircle2,
  Circle,
  CircleDollarSign,
  Layers3,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

import {
  Badge,
} from "@/components/ui/badge";
import {
  Button,
} from "@/components/ui/button";
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
  countCompletedAssumptionSections,
  parseStoredFinancialAssumptions,
} from "@/lib/finance/assumptions/storage";
import {
  requireOwnedProject,
} from "@/lib/projects/project-access";
import {
  formatProjectStartMonth,
  formatProjectUpdatedAt,
} from "@/lib/projects/project-dates";
import {
  countScenarioModifiers,
  formatRevenueMode,
  formatScenarioType,
} from "@/lib/projects/project-formatting";

export const metadata: Metadata = {
  title: "Financial model",
};

export default async function ProjectOverviewPage({
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

  const project =
    await requireOwnedProject(
      user.id,
      projectId,
    );

  const assumptions =
    parseStoredFinancialAssumptions(
      project.baseAssumptions,
    );

  const completedSections =
    countCompletedAssumptionSections(
      assumptions,
    );

  const assumptionsComplete =
    completedSections ===
    3;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="text-sm font-medium text-muted-foreground">
            Model overview
          </div>

          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            {
              project.name
            }
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Configure the operating assumptions that will
            power this model&apos;s deterministic financial forecast.
          </p>
        </div>

        <Badge
          variant={
            assumptionsComplete
              ? "default"
              : "outline"
          }
        >
          {completedSections}/3 assumption sections
        </Badge>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewMetric
          icon={
            Building2
          }
          label="Industry"
          value={
            project.industry ??
            "Not specified"
          }
        />

        <OverviewMetric
          icon={
            CircleDollarSign
          }
          label="Currency"
          value={
            project.currency
          }
        />

        <OverviewMetric
          icon={
            CalendarRange
          }
          label="Forecast"
          value={`${project.horizonMonths} months`}
        />

        <OverviewMetric
          icon={
            TrendingUp
          }
          label="Revenue model"
          value={formatRevenueMode(
            project.revenueMode,
          )}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Card className="border-border/70">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>
                  Assumption setup
                </CardTitle>

                <CardDescription className="mt-1">
                  Complete all three model-input sections before financial calculations begin.
                </CardDescription>
              </div>

              <SlidersHorizontal
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <AssumptionSetupRow
              href={`/projects/${project.id}/assumptions`}
              label="General assumptions"
              detail="Starting cash and corporate tax"
              complete={
                assumptions.completion
                  .general
              }
            />

            <AssumptionSetupRow
              href={`/projects/${project.id}/revenue`}
              label="Revenue assumptions"
              detail={formatRevenueMode(
                project.revenueMode,
              )}
              complete={
                assumptions.completion
                  .revenue
              }
            />

            <AssumptionSetupRow
              href={`/projects/${project.id}/expenses`}
              label="Expense assumptions"
              detail="Salaries, rent, marketing, COGS and operating costs"
              complete={
                assumptions.completion
                  .expenses
              }
            />
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>
              Model configuration
            </CardTitle>

            <CardDescription>
              Persistent structural information.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <ConfigurationRow
              label="Forecast start"
              value={formatProjectStartMonth(
                project.startMonth,
              )}
            />

            <ConfigurationRow
              label="Forecast horizon"
              value={`${project.horizonMonths} months`}
            />

            <ConfigurationRow
              label="Revenue engine"
              value={formatRevenueMode(
                project.revenueMode,
              )}
            />

            <ConfigurationRow
              label="Model version"
              value={
                project.modelVersion
              }
            />

            <ConfigurationRow
              label="Financing events"
              value={String(
                project._count
                  .financingEvents,
              )}
            />

            <ConfigurationRow
              label="Monthly overrides"
              value={String(
                project._count
                  .monthlyOverrides,
              )}
            />

            <ConfigurationRow
              label="Last updated"
              value={formatProjectUpdatedAt(
                project.updatedAt,
              )}
            />
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="border-border/70">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>
                  Scenario structure
                </CardTitle>

                <CardDescription className="mt-1">
                  Scenario definitions are stored now. The scenario engine will apply them later.
                </CardDescription>
              </div>

              <Layers3
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
          </CardHeader>

          <CardContent className="grid gap-4 md:grid-cols-3">
            {project.scenarios.map(
              (
                scenario,
              ) => {
                const modifierCount =
                  countScenarioModifiers(
                    scenario.modifiers,
                  );

                return (
                  <div
                    key={
                      scenario.id
                    }
                    className="rounded-xl border p-5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium">
                        {
                          scenario.name
                        }
                      </div>

                      <Badge
                        variant={
                          scenario.type ===
                          "BASE"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {formatScenarioType(
                          scenario.type,
                        )}
                      </Badge>
                    </div>

                    <div className="mt-6 text-2xl font-semibold">
                      {
                        modifierCount
                      }
                    </div>

                    <div className="mt-1 text-xs text-muted-foreground">
                      {modifierCount ===
                      1
                        ? "scenario modifier"
                        : "scenario modifiers"}
                    </div>
                  </div>
                );
              },
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="overflow-hidden border-dashed">
          <CardContent className="flex flex-col justify-between gap-6 p-7 md:flex-row md:items-center">
            <div className="flex gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
                <SlidersHorizontal
                  className="size-5"
                  aria-hidden="true"
                />
              </div>

              <div>
                <div className="font-semibold">
                  {assumptionsComplete
                    ? "Financial assumptions are ready"
                    : "Complete the financial assumptions"}
                </div>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {assumptionsComplete
                    ? "The model now contains all core inputs required for the financial calculation engine."
                    : `${3 - completedSections} assumption section${3 - completedSections === 1 ? "" : "s"} remain before the model is calculation-ready.`}
                </p>
              </div>
            </div>

            <Button
              asChild
              className="shrink-0"
            >
              <Link
                href={`/projects/${project.id}/assumptions`}
              >
                {assumptionsComplete
                  ? "Review assumptions"
                  : "Configure assumptions"}

                <ArrowRight
                  className="size-4"
                  aria-hidden="true"
                />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

type OverviewMetricProps = {
  icon: React.ComponentType<{
    className?: string;
  }>;

  label: string;
  value: string;
};

function OverviewMetric({
  icon: Icon,
  label,
  value,
}: OverviewMetricProps) {
  return (
    <Card className="border-border/70">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardDescription>
            {label}
          </CardDescription>

          <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
            <Icon
              className="size-4"
              aria-hidden="true"
            />
          </div>
        </div>

        <CardTitle className="mt-2 truncate text-xl">
          {value}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

function AssumptionSetupRow({
  href,
  label,
  detail,
  complete,
}: {
  href: string;
  label: string;
  detail: string;
  complete: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/30"
    >
      {complete ? (
        <CheckCircle2
          className="size-5 shrink-0"
          aria-hidden="true"
        />
      ) : (
        <Circle
          className="size-5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      )}

      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">
          {label}
        </div>

        <div className="mt-1 truncate text-xs text-muted-foreground">
          {detail}
        </div>
      </div>

      <ArrowRight
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
    </Link>
  );
}

function ConfigurationRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-muted-foreground">
        {label}
      </span>

      <span className="text-right text-sm font-medium">
        {value}
      </span>
    </div>
  );
}
