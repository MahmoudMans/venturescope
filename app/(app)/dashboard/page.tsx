import type {
  Metadata,
} from "next";
import type {
  LucideIcon,
} from "lucide-react";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarRange,
  CircleDollarSign,
  Gauge,
  Plus,
} from "lucide-react";
import Link from "next/link";

import {
  ProjectCard,
} from "@/components/projects/project-card";
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
  prisma,
} from "@/lib/db/prisma";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user =
    await requireUser();

  const projects =
    await prisma.project.findMany({
      where: {
        userId:
          user.id,
      },

      orderBy: {
        updatedAt:
          "desc",
      },

      select: {
        id: true,
        name: true,
        industry: true,
        currency: true,
        startMonth: true,
        horizonMonths: true,
        revenueMode: true,
        updatedAt: true,

        _count: {
          select: {
            scenarios: true,
          },
        },
      },
    });

  const firstName =
    user.name
      ?.trim()
      .split(/\s+/)[0] ??
    "there";

  const scenarioReadyModels =
    projects.filter(
      (
        project,
      ) =>
        project._count
          .scenarios >= 3,
    ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 text-sm text-muted-foreground">
            Welcome back,{" "}
            {firstName}
          </div>

          <h1 className="text-3xl font-semibold tracking-tight">
            Financial models
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Create and manage the financial models that will
            power VentureScope forecasts and scenario analysis.
          </p>
        </div>

        <Button
          asChild
          size="lg"
        >
          <Link href="/projects/new">
            <Plus
              className="size-4"
              aria-hidden="true"
            />

            Create model
          </Link>
        </Button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Financial models"
          value={String(
            projects.length,
          )}
          detail="Private models"
          icon={
            BriefcaseBusiness
          }
        />

        <MetricCard
          label="Scenario-ready"
          value={String(
            scenarioReadyModels,
          )}
          detail="Base, Bull and Bear initialized"
          icon={
            BarChart3
          }
        />

        <MetricCard
          label="Projected revenue"
          value="—"
          detail="Available after financial engine"
          icon={
            CircleDollarSign
          }
        />

        <MetricCard
          label="Median runway"
          value="—"
          detail="Available after cash forecasting"
          icon={
            Gauge
          }
        />
      </section>

      <section
        id="models"
        className="scroll-mt-24"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Your models
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {
                projects.length
              }{" "}
              {projects.length ===
              1
                ? "financial model"
                : "financial models"}
            </p>
          </div>

          {projects.length >
          0 ? (
            <Badge variant="outline">
              Updated models appear first
            </Badge>
          ) : null}
        </div>

        {projects.length ===
        0 ? (
          <Card className="overflow-hidden border-dashed">
            <CardContent className="grid gap-8 p-8 lg:grid-cols-[1fr_0.75fr] lg:p-10">
              <div className="flex flex-col justify-center">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-foreground text-background">
                  <BriefcaseBusiness
                    className="size-6"
                    aria-hidden="true"
                  />
                </div>

                <h2 className="mt-6 text-2xl font-semibold tracking-tight">
                  Build your first financial model.
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
                  Start by defining the company, forecast
                  period and revenue model. VentureScope will
                  automatically initialize Base, Bull and Bear
                  scenarios.
                </p>

                <Button
                  asChild
                  className="mt-6 w-fit"
                >
                  <Link href="/projects/new">
                    <Plus
                      className="size-4"
                      aria-hidden="true"
                    />

                    Create first model
                  </Link>
                </Button>
              </div>

              <div className="rounded-2xl border bg-muted/30 p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Model foundation
                </div>

                <div className="mt-5 space-y-5">
                  <FeatureLine
                    icon={
                      BriefcaseBusiness
                    }
                    title="Company structure"
                    description="Company, industry, currency and forecast horizon."
                  />

                  <FeatureLine
                    icon={
                      CalendarRange
                    }
                    title="12–60 months"
                    description="Choose the forecasting window for each model."
                  />

                  <FeatureLine
                    icon={
                      BarChart3
                    }
                    title="Scenario-ready"
                    description="Base, Bull and Bear scenarios are created automatically."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {projects.map(
              (
                project,
              ) => (
                <ProjectCard
                  key={
                    project.id
                  }
                  project={
                    project
                  }
                />
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
};

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: MetricCardProps) {
  return (
    <Card className="border-border/70">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div>
          <CardDescription>
            {label}
          </CardDescription>

          <CardTitle className="mt-2 text-3xl tracking-tight">
            {value}
          </CardTitle>
        </div>

        <div className="flex size-9 items-center justify-center rounded-xl bg-muted">
          <Icon
            className="size-4"
            aria-hidden="true"
          />
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-xs text-muted-foreground">
          {detail}
        </p>
      </CardContent>
    </Card>
  );
}

type FeatureLineProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

function FeatureLine({
  icon: Icon,
  title,
  description,
}: FeatureLineProps) {
  return (
    <div className="flex gap-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border bg-background">
        <Icon
          className="size-4"
          aria-hidden="true"
        />
      </div>

      <div>
        <div className="text-sm font-medium">
          {title}
        </div>

        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}
