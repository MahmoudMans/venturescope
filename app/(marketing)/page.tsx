import {
  ArrowRight,
  BarChart3,
  Check,
  CircleDollarSign,
  Gauge,
  Layers3,
  LineChart,
  LockKeyhole,
  Rocket,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import {
  VentureScopeLogo,
} from "@/components/brand/venturescope-logo";
import {
  PublicFooterLinks,
} from "@/components/site/public-page-shell";
import {
  ThemeToggle,
} from "@/components/theme/theme-toggle";
import {
  Badge,
} from "@/components/ui/badge";
import {
  Button,
} from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  buildOrbitAnalyticsDemoForecast,
} from "@/lib/demo/orbit-analytics";
import {
  formatCompactCurrencyValue,
  formatLongMonthKey,
  formatRunway,
} from "@/lib/finance/formatting";

export default function MarketingPage() {
  const demo =
    buildOrbitAnalyticsDemoForecast(
      "demo-base",
    );

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <VentureScopeLogo shortOnPhone />

          <nav className="hidden items-center gap-7 md:flex">
            <Link
              href="/demo"
              className="touch-reach text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Live demo
            </Link>

            <a
              href="#platform"
              className="touch-reach text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Platform
            </a>

            <a
              href="#workflow"
              className="touch-reach text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Workflow
            </a>
          </nav>

          <div className="flex items-center gap-2">
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
                Get started
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden">
          <div
            aria-hidden="true"
            className="surface-glow absolute inset-0 -z-10"
          />

          <div
            aria-hidden="true"
            className="surface-grid absolute inset-0 -z-10 opacity-60 [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_65%)]"
          />

          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-28">
            <div>
              <Badge
                variant="outline"
                className="mb-6"
              >
                <Sparkles
                  className="mr-1 size-3"
                  aria-hidden="true"
                />

                <span className="whitespace-normal text-center">
                  FINANCIAL PLANNING & SCENARIO SIMULATION
                </span>
              </Badge>

              <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                Model your startup.
                <span className="block text-brand-gradient">
                  Stress-test the future.
                </span>
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                VentureScope turns operating assumptions into deterministic forecasts,
                cash runway, scenario comparisons and executive financial reports—without
                paid market-data APIs.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                >
                  <Link href="/register">
                    Build a financial model

                    <ArrowRight
                      className="size-4"
                      aria-hidden="true"
                    />
                  </Link>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                >
                  <Link href="/demo">
                    Explore live demo

                    <Rocket
                      className="size-4"
                      aria-hidden="true"
                    />
                  </Link>
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Check
                    className="size-3.5"
                    aria-hidden="true"
                  />

                  No paid API required
                </span>

                <span className="flex items-center gap-2">
                  <Check
                    className="size-3.5"
                    aria-hidden="true"
                  />

                  Deterministic calculations
                </span>

                <span className="flex items-center gap-2">
                  <Check
                    className="size-3.5"
                    aria-hidden="true"
                  />

                  Private workspaces
                </span>
              </div>
            </div>

            <Card className="overflow-hidden border-border/70 shadow-xl shadow-foreground/5">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Orbit Analytics
                    </div>

                    <CardTitle className="mt-2">
                      Base Case
                    </CardTitle>
                  </div>

                  <Badge>
                    LIVE DEMO
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <HeroMetric
                    label="First-year revenue"
                    value={formatCompactCurrencyValue(
                      demo.metrics
                        .firstYearRevenue,
                      demo.currency,
                    )}
                  />

                  <HeroMetric
                    label="Ending cash"
                    value={formatCompactCurrencyValue(
                      demo.metrics
                        .endingCash,
                      demo.currency,
                    )}
                  />

                  <HeroMetric
                    label="Runway"
                    value={formatRunway(
                      demo.metrics
                        .runway,
                    )}
                  />

                  <HeroMetric
                    label="Break-even"
                    value={
                      demo.metrics
                        .breakEven
                        .sustainedBreakEvenMonth
                        ? formatLongMonthKey(
                            demo.metrics
                              .breakEven
                              .sustainedBreakEvenMonth,
                          )
                        : "Not reached"
                    }
                  />
                </div>

                <div className="mt-6 rounded-2xl border bg-muted/20 p-5">
                  <div className="flex h-40 items-end gap-2">
                    {demo.months
                      .slice(
                        0,
                        18,
                      )
                      .map(
                        (
                          month,
                        ) => {
                          const maxRevenue =
                            Math.max(
                              ...demo.months
                                .slice(
                                  0,
                                  18,
                                )
                                .map(
                                  (
                                    candidate,
                                  ) =>
                                    Number(
                                      candidate.revenue,
                                    ),
                                ),
                              1,
                            );

                          const height =
                            Math.max(
                              8,
                              (
                                Number(
                                  month.revenue,
                                ) /
                                maxRevenue
                              ) *
                                100,
                            );

                          return (
                            <div
                              key={
                                month.month
                              }
                              className="flex flex-1 items-end"
                              title={
                                month.month
                              }
                            >
                              <div
                                className="w-full rounded-t-sm bg-foreground/80"
                                style={{
                                  height:
                                    `${height}%`,
                                }}
                              />
                            </div>
                          );
                        },
                      )}
                  </div>

                  <div className="mt-3 flex justify-between text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    <span>
                      Revenue
                    </span>

                    <span>
                      First 18 months
                    </span>
                  </div>
                </div>

                <Button
                  asChild
                  variant="outline"
                  className="mt-6 w-full"
                >
                  <Link href="/demo">
                    Open Orbit Analytics

                    <ArrowRight
                      className="size-4"
                      aria-hidden="true"
                    />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <section
          id="platform"
          className="border-y bg-muted/20"
        >
          <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
            <div className="max-w-3xl">
              <div className="text-sm font-semibold text-muted-foreground">
                ONE FINANCIAL ENGINE
              </div>

              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                From assumptions to decision-ready analysis.
              </h2>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <CapabilityCard
                icon={
                  SlidersHorizontal
                }
                title="Operating assumptions"
                description="Revenue, customers, CAC, churn, ARPU, salaries, rent, marketing, COGS, tax and custom expenses."
              />

              <CapabilityCard
                icon={
                  LineChart
                }
                title="Deterministic forecasting"
                description="Monthly and annual Revenue, P&L, cash flow, customers, burn, runway and break-even."
              />

              <CapabilityCard
                icon={
                  Layers3
                }
                title="Scenario analysis"
                description="Base, Bull, Bear and custom scenarios with side-by-side financial outcomes."
              />

              <CapabilityCard
                icon={
                  Gauge
                }
                title="Live simulation"
                description="Experiment with growth, CAC, churn, ARPU and COGS without modifying the saved model."
              />

              <CapabilityCard
                icon={
                  CircleDollarSign
                }
                title="Financing"
                description="Equity, grants, debt, APR, principal repayment and runway impact."
              />

              <CapabilityCard
                icon={
                  BarChart3
                }
                title="Executive reporting"
                description="Professional dashboards plus CSV and PDF exports generated without paid services."
              />
            </div>
          </div>
        </section>

        <section
          id="workflow"
          className="mx-auto max-w-7xl px-5 py-20 lg:px-8"
        >
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <Badge variant="outline">
                WORKFLOW
              </Badge>

              <h2 className="mt-5 text-3xl font-semibold tracking-tight">
                Build the model once. Explore many futures.
              </h2>

              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                VentureScope separates persistent assumptions from calculated outputs,
                so every dashboard, scenario and report comes from the same financial authority.
              </p>

              <Button
                asChild
                className="mt-6"
              >
                <Link href="/demo">
                  See the complete workflow

                  <ArrowRight
                    className="size-4"
                    aria-hidden="true"
                  />
                </Link>
              </Button>
            </div>

            <div className="space-y-3">
              {[
                [
                  "01",
                  "Create the financial model",
                  "Company, currency, horizon and revenue engine.",
                ],

                [
                  "02",
                  "Configure operating assumptions",
                  "Revenue, customer economics, expenses and cash.",
                ],

                [
                  "03",
                  "Add financing and timeline events",
                  "Funding rounds, debt and month-specific planning changes.",
                ],

                [
                  "04",
                  "Run scenarios",
                  "Base, Bull, Bear and custom stress cases.",
                ],

                [
                  "05",
                  "Analyze and report",
                  "Dashboards, tables, CSV and executive PDF output.",
                ],
              ].map(
                (
                  [
                    number,
                    title,
                    description,
                  ],
                ) => (
                  <div
                    key={
                      number
                    }
                    className="grid gap-3 rounded-2xl border p-5 sm:grid-cols-[54px_1fr]"
                  >
                    <div className="text-sm font-semibold text-muted-foreground">
                      {
                        number
                      }
                    </div>

                    <div>
                      <div className="font-medium">
                        {
                          title
                        }
                      </div>

                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {
                          description
                        }
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </section>

        <section className="bg-brand-panel border-t text-white">
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-16 lg:grid-cols-[1fr_auto] lg:px-8">
            <div>
              <div className="flex items-center gap-2 text-sm text-white/70">
                <LockKeyhole
                  className="size-4"
                  aria-hidden="true"
                />

                Private financial workspaces
              </div>

              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Ready to model your own company?
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80">
                Start from your own assumptions or explore Orbit Analytics first.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="bg-white text-slate-900 hover:bg-white/90"
              >
                <Link href="/register">
                  Create account
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/demo">
                  Open demo
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <VentureScopeLogo href="" />

          <PublicFooterLinks />

          <p>
            Deterministic financial planning. Free stack, no paid APIs required.
          </p>
        </div>
      </footer>
    </div>
  );
}

function HeroMetric({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
        {
          label
        }
      </div>

      <div className="mt-2 text-lg font-semibold">
        {
          value
        }
      </div>
    </div>
  );
}

function CapabilityCard({
  icon: Icon,
  title,
  description,
}: {
  icon:
    React.ComponentType<{
      className?: string;
    }>;

  title: string;

  description: string;
}) {
  return (
    <Card className="border-border/70">
      <CardContent className="p-6">
        <div className="flex size-10 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-sm">
          <Icon
            className="size-4"
            aria-hidden="true"
          />
        </div>

        <div className="mt-5 font-semibold">
          {
            title
          }
        </div>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {
            description
          }
        </p>
      </CardContent>
    </Card>
  );
}
