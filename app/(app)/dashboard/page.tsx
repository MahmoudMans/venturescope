import type {
  Metadata,
} from "next";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarRange,
  CircleDollarSign,
  Gauge,
  LineChart,
  Plus,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db/prisma";

export const metadata: Metadata = {
  title: "Dashboard",
};

const upcomingCapabilities = [
  {
    icon: LineChart,
    title: "Forecast engine",
    description:
      "Generate monthly and annual operating forecasts.",
  },

  {
    icon: Gauge,
    title: "Cash & runway",
    description:
      "Understand burn, cash exhaustion and funding requirements.",
  },

  {
    icon: BarChart3,
    title: "Scenario analysis",
    description:
      "Compare Base, Bull, Bear and custom business scenarios.",
  },
];

export default async function DashboardPage() {
  const user = await requireUser();

  const projectCount =
    await prisma.project.count({
      where: {
        userId: user.id,
      },
    });

  const firstName =
    user.name
      ?.trim()
      .split(/\s+/)[0] ??
    "there";

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 text-sm text-muted-foreground">
            Welcome back, {firstName}
          </div>

          <h1 className="text-3xl font-semibold tracking-tight">
            Financial models
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            VentureScope will turn your operating assumptions
            into financial forecasts, runway analysis and
            scenario comparisons.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline">
            Foundation complete
          </Badge>

          <Button disabled>
            <Plus
              className="size-4"
              aria-hidden="true"
            />

            Create model
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Financial models"
          value={String(projectCount)}
          detail="Your private models"
          icon={BriefcaseBusiness}
        />

        <MetricCard
          label="Projected revenue"
          value="—"
          detail="Available after modelling"
          icon={CircleDollarSign}
        />

        <MetricCard
          label="Median runway"
          value="—"
          detail="Available after forecasting"
          icon={CalendarRange}
        />

        <MetricCard
          label="Profitable models"
          value="—"
          detail="Available after P&L"
          icon={TrendingUp}
        />
      </section>

      <section>
        {projectCount === 0 ? (
          <Card className="overflow-hidden border-dashed">
            <CardContent className="grid gap-8 p-8 lg:grid-cols-[1fr_0.85fr] lg:p-10">
              <div className="flex flex-col justify-center">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-foreground text-background">
                  <BriefcaseBusiness
                    className="size-6"
                    aria-hidden="true"
                  />
                </div>

                <h2 className="mt-6 text-2xl font-semibold tracking-tight">
                  Your workspace is ready.
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
                  The next development step adds complete
                  financial-model management: create, list,
                  open, rename, duplicate and delete models.
                </p>

                <div className="mt-6 flex items-center gap-2">
                  <Button disabled>
                    Create your first model

                    <ArrowRight
                      className="size-4"
                      aria-hidden="true"
                    />
                  </Button>

                  <Badge variant="secondary">
                    Step 2
                  </Badge>
                </div>
              </div>

              <div className="rounded-2xl border bg-muted/30 p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Coming into this workspace
                </div>

                <div className="mt-5 space-y-5">
                  {upcomingCapabilities.map(
                    (capability) => {
                      const Icon =
                        capability.icon;

                      return (
                        <div
                          key={
                            capability.title
                          }
                          className="flex gap-4"
                        >
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border bg-background">
                            <Icon
                              className="size-4"
                              aria-hidden="true"
                            />
                          </div>

                          <div>
                            <div className="text-sm font-medium">
                              {
                                capability.title
                              }
                            </div>

                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                              {
                                capability.description
                              }
                            </p>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </section>
    </div>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  icon: React.ComponentType<{
    className?: string;
    "aria-hidden"?: boolean | "true" | "false";
  }>;
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
