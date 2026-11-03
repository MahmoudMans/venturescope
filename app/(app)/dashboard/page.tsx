import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarRange,
  CircleAlert,
  CircleDollarSign,
  Gauge,
  Plus,
} from "lucide-react";
import Link from "next/link";

import { RecoveryReminderCard } from "@/components/account/recovery-reminder-card";
import { StatusNotice } from "@/components/app/status-notice";
import { DashboardModelGrid } from "@/components/dashboard/model-grid";
import { SharedModelsSection } from "@/components/dashboard/shared-models-section";
import { SampleModelForm } from "@/components/projects/sample-model-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { firstNameOf } from "@/lib/account/display-name";
import { loadDisplayName } from "@/lib/account/load-display-name";
import { shouldShowRecoveryReminder } from "@/lib/auth/load-recovery-reminder";
import { requireUser } from "@/lib/auth/require-user";
import { loadSharedModels } from "@/lib/dashboard/load-shared-models";
import { getModelNotice } from "@/lib/dashboard/model-notices";
import { describeModelCount, isSharedModel } from "@/lib/dashboard/model-sharing-status";
import { loadDashboardModels } from "@/lib/dashboard/portfolio-kpis";
import { buildDashboardSummary, type DashboardAttentionItem } from "@/lib/dashboard/summary";
import { getSampleNotice } from "@/lib/projects/sample-model";

export const metadata: Metadata = {
  title: "Dashboard",
};

const attentionBadge: Record<
  DashboardAttentionItem["severity"],
  {
    label: string;
    variant: "destructive" | "warning" | "info";
  }
> = {
  danger: {
    label: "Critical",
    variant: "destructive",
  },

  warning: {
    label: "Watch",
    variant: "warning",
  },

  info: {
    label: "Setup",
    variant: "info",
  },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string | string[];
  }>;
}) {
  const user = await requireUser();

  const { status } = await searchParams;

  const notice = getSampleNotice(status) ?? getModelNotice(status);

  const [models, sharedModels, displayName, showRecoveryReminder] = await Promise.all([
    loadDashboardModels(user.id),
    loadSharedModels(user.id),
    loadDisplayName(user.id, user.name),
    shouldShowRecoveryReminder(user.id),
  ]);

  const summary = buildDashboardSummary(models);

  const sharedCount = models.filter(isSharedModel).length;

  const firstName = firstNameOf(displayName) || "there";

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="surface-glow pointer-events-none absolute inset-x-0 top-0 h-72"
      />

      <div className="relative mx-auto max-w-7xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
        <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 text-sm text-muted-foreground">Welcome back, {firstName}</div>

            <h1 className="text-3xl font-semibold tracking-tight">Financial models</h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Create and manage the financial models that will power VentureScope forecasts and
              scenario analysis.
            </p>
          </div>

          <Button asChild size="lg">
            <Link href="/projects/new">
              <Plus className="size-4" aria-hidden="true" />
              Create model
            </Link>
          </Button>
        </section>

        {notice ? <StatusNotice tone={notice.tone}>{notice.message}</StatusNotice> : null}

        {showRecoveryReminder ? <RecoveryReminderCard /> : null}

        <section
          aria-label="Portfolio summary"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <MetricCard
            label="Financial models"
            value={String(summary.modelCount)}
            detail={`${summary.forecastReady} with a live forecast`}
            icon={BriefcaseBusiness}
          />

          <MetricCard
            label="Scenario-ready"
            value={String(summary.scenarioReady)}
            detail="Base, Bull and Bear initialized"
            icon={BarChart3}
          />

          <MetricCard
            label="Projected revenue"
            value={summary.revenueLabel}
            detail={summary.revenueDetail}
            icon={CircleDollarSign}
          />

          <MetricCard
            label="Median runway"
            value={summary.runwayLabel}
            detail={summary.runwayDetail}
            icon={Gauge}
          />
        </section>

        {summary.attention.length > 0 ? (
          <section aria-labelledby="attention-heading">
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle id="attention-heading" className="flex items-center gap-2">
                  <CircleAlert className="size-4 text-warning" aria-hidden="true" />
                  Needs attention
                </CardTitle>

                <CardDescription>
                  Models with a short cash runway or unfinished assumptions.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <ul className="divide-y">
                  {summary.attention.map((item) => {
                    const badge = attentionBadge[item.severity];

                    return (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          className="group flex items-center justify-between gap-4 py-3 text-sm"
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <Badge variant={badge.variant}>{badge.label}</Badge>

                            <span className="break-words group-hover:text-primary">
                              {item.message}
                            </span>
                          </span>

                          <ArrowRight
                            className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                            aria-hidden="true"
                          />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          </section>
        ) : null}

        <section id="models">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Your models</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {describeModelCount(models.length, sharedCount)}
              </p>
            </div>
          </div>

          {models.length === 0 ? (
            <Card className="overflow-hidden border-dashed">
              <CardContent className="grid gap-8 p-8 lg:grid-cols-[1fr_0.75fr] lg:p-10">
                <div className="flex flex-col justify-center">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-sm">
                    <BriefcaseBusiness className="size-6" aria-hidden="true" />
                  </div>

                  <h2 className="mt-6 text-2xl font-semibold tracking-tight">
                    Build your first financial model.
                  </h2>

                  <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
                    Start by defining the company, forecast period and revenue model. VentureScope
                    will automatically initialize Base, Bull and Bear scenarios.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Button asChild size="lg" className="w-fit">
                      <Link href="/projects/new">
                        <Plus className="size-4" aria-hidden="true" />
                        Create first model
                      </Link>
                    </Button>

                    <SampleModelForm />
                  </div>

                  <p className="mt-3 max-w-xl text-xs leading-5 text-muted-foreground">
                    Not sure where to start? The sample model is a complete example with
                    assumptions, scenarios and financing, so every page has numbers to explore.
                  </p>
                </div>

                <div className="rounded-2xl border bg-muted/30 p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Model foundation
                  </div>

                  <div className="mt-5 space-y-5">
                    <FeatureLine
                      icon={BriefcaseBusiness}
                      title="Company structure"
                      description="Company, industry, currency and forecast horizon."
                    />

                    <FeatureLine
                      icon={CalendarRange}
                      title="12–60 months"
                      description="Choose the forecasting window for each model."
                    />

                    <FeatureLine
                      icon={BarChart3}
                      title="Scenario-ready"
                      description="Base, Bull and Bear scenarios are created automatically."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <DashboardModelGrid models={models} />
          )}
        </section>

        <SharedModelsSection models={sharedModels} />
      </div>
    </div>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
};

function MetricCard({ label, value, detail, icon: Icon }: MetricCardProps) {
  return (
    <Card className="border-border/70">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="min-w-0">
          <CardDescription>{label}</CardDescription>

          <CardTitle className="mt-2 break-words text-3xl tracking-tight tabular-nums">
            {value}
          </CardTitle>
        </div>

        <div className="hidden size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary @min-[11rem]/card-header:flex">
          <Icon className="size-4" aria-hidden="true" />
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-xs leading-5 text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

type FeatureLineProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

function FeatureLine({ icon: Icon, title, description }: FeatureLineProps) {
  return (
    <div className="flex gap-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border bg-background text-primary">
        <Icon className="size-4" aria-hidden="true" />
      </div>

      <div>
        <div className="text-sm font-medium">{title}</div>

        <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
