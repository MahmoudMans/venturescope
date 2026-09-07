import {
  ArrowRight,
  BarChart3,
  Calculator,
  Check,
  Gauge,
  LineChart,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import { VentureScopeLogo } from "@/components/brand/venturescope-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

const capabilities = [
  {
    title: "Financial forecasting",
    description:
      "Turn operating assumptions into structured monthly financial forecasts.",
    icon: LineChart,
  },

  {
    title: "Scenario simulation",
    description:
      "Compare Base, Bull and Bear outcomes without rebuilding your model.",
    icon: BarChart3,
  },

  {
    title: "Runway intelligence",
    description:
      "Understand cash consumption, burn rate and the timing of funding needs.",
    icon: Gauge,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-svh bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <VentureScopeLogo />

          <div className="flex items-center gap-1">
            <ThemeToggle />

            <Button
              asChild
              variant="ghost"
              className="hidden sm:inline-flex"
            >
              <Link href="/login">
                Sign in
              </Link>
            </Button>

            <Button asChild>
              <Link href="/register">
                Build a model

                <ArrowRight
                  className="size-4"
                  aria-hidden="true"
                />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 -z-10 bg-muted/20" />

        <div className="mx-auto grid max-w-7xl gap-16 px-5 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-28">
          <div className="flex flex-col justify-center">
            <div className="mb-6 flex flex-wrap gap-2">
              <Badge variant="secondary">
                No paid financial API
              </Badge>

              <Badge variant="outline">
                12–60 month forecasts
              </Badge>

              <Badge variant="outline">
                Base · Bull · Bear
              </Badge>
            </div>

            <h1 className="max-w-3xl text-balance text-5xl font-semibold tracking-[-0.045em] sm:text-6xl lg:text-7xl">
              Model your startup.
              <br />

              <span className="text-muted-foreground">
                Stress-test the future.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">
              VentureScope transforms revenue, customer,
              expense and financing assumptions into
              decision-ready financial forecasts.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
              >
                <Link href="/register">
                  Start modelling

                  <ArrowRight
                    className="size-4"
                    aria-hidden="true"
                  />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
              >
                <Link href="/login">
                  Open workspace
                </Link>
              </Button>
            </div>

            <div className="mt-9 grid max-w-xl gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              {[
                "P&L forecasting",
                "Cash-flow projections",
                "Burn & runway",
                "MRR & customer modelling",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2"
                >
                  <div className="flex size-5 items-center justify-center rounded-full bg-foreground text-background">
                    <Check
                      className="size-3"
                      aria-hidden="true"
                    />
                  </div>

                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <Card className="w-full overflow-hidden border-border/70 shadow-2xl shadow-black/10">
              <div className="flex items-center justify-between border-b bg-muted/30 px-5 py-4">
                <div>
                  <div className="text-sm font-semibold">
                    Orbit Analytics
                  </div>

                  <div className="mt-1 text-xs text-muted-foreground">
                    Base Case · 36 months
                  </div>
                </div>

                <Badge>
                  BASE
                </Badge>
              </div>

              <CardContent className="p-0">
                <div className="grid grid-cols-2 border-b sm:grid-cols-4">
                  {[
                    ["Revenue", "€620K", "+23.4%"],
                    ["EBITDA", "€87K", "14.0%"],
                    ["Runway", "24 mo", "+6 mo"],
                    ["MRR", "€51.7K", "+18.6%"],
                  ].map(
                    ([
                      label,
                      value,
                      change,
                    ]) => (
                      <div
                        key={label}
                        className="border-b p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
                      >
                        <div className="text-xs text-muted-foreground">
                          {label}
                        </div>

                        <div className="mt-2 text-xl font-semibold tracking-tight">
                          {value}
                        </div>

                        <div className="mt-1 text-xs text-muted-foreground">
                          {change}
                        </div>
                      </div>
                    ),
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">
                        Revenue & expenses
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Illustrative financial trajectory
                      </div>
                    </div>

                    <LineChart
                      className="size-5 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="mt-8 flex h-44 items-end gap-2">
                    {[
                      31,
                      38,
                      35,
                      48,
                      52,
                      58,
                      65,
                      71,
                      74,
                      82,
                      88,
                      96,
                    ].map(
                      (
                        height,
                        index,
                      ) => (
                        <div
                          key={`${height}-${index}`}
                          className="relative flex h-full flex-1 items-end"
                        >
                          <div
                            className="w-full rounded-sm bg-foreground/90"
                            style={{
                              height: `${height}%`,
                            }}
                          />
                        </div>
                      ),
                    )}
                  </div>

                  <div className="mt-4 flex justify-between text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    <span>
                      Jan
                    </span>

                    <span>
                      Dec
                    </span>
                  </div>
                </div>

                <div className="grid gap-px border-t bg-border sm:grid-cols-3">
                  {[
                    {
                      icon: Calculator,
                      value: "71%",
                      label: "Gross margin",
                    },
                    {
                      icon: ShieldCheck,
                      value: "Sep 27",
                      label: "Break-even",
                    },
                    {
                      icon: Gauge,
                      value: "€213K",
                      label: "Ending cash",
                    },
                  ].map((metric) => {
                    const Icon = metric.icon;

                    return (
                      <div
                        key={metric.label}
                        className="bg-background p-4"
                      >
                        <Icon
                          className="mb-3 size-4 text-muted-foreground"
                          aria-hidden="true"
                        />

                        <div className="font-semibold">
                          {metric.value}
                        </div>

                        <div className="mt-1 text-xs text-muted-foreground">
                          {metric.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="max-w-2xl">
          <div className="text-sm font-medium text-muted-foreground">
            Built for decisions
          </div>

          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Financial modelling without spreadsheet chaos.
          </h2>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {capabilities.map((capability) => {
            const Icon = capability.icon;

            return (
              <Card
                key={capability.title}
                className="border-border/70"
              >
                <CardContent className="p-6">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                    <Icon
                      className="size-5"
                      aria-hidden="true"
                    />
                  </div>

                  <h3 className="mt-6 font-semibold">
                    {capability.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {capability.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
