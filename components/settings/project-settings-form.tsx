"use client";

import {
  CalendarRange,
  Coins,
  Database,
  TrendingUp,
} from "lucide-react";
import {
  useActionState,
} from "react";

import {
  updateProjectSettingsAction,
} from "@/app/(app)/projects/settings-actions";
import {
  SettingsActionMessage,
} from "@/components/settings/settings-action-message";
import {
  SettingsSubmitButton,
} from "@/components/settings/settings-submit-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Input,
} from "@/components/ui/input";
import {
  Label,
} from "@/components/ui/label";
import {
  PROJECT_CURRENCIES,
  PROJECT_HORIZONS,
  REVENUE_MODE_OPTIONS,
} from "@/lib/projects/project-options";
import {
  initialProjectSettingsActionState,
} from "@/lib/settings/action-state";

export function ProjectSettingsForm({
  project,
  startMonth,
}: {
  project: {
    id: string;

    name: string;

    industry: string | null;

    currency: string;

    horizonMonths: number;

    revenueMode: string;
  };

  startMonth: string;
}) {
  const [
    state,
    action,
  ] = useActionState(
    updateProjectSettingsAction,
    initialProjectSettingsActionState,
  );

  return (
    <form
      action={
        action
      }
    >
      <input
        type="hidden"
        name="projectId"
        value={
          project.id
        }
      />

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>
            Project configuration
          </CardTitle>

          <CardDescription className="max-w-3xl leading-6">
            Update company metadata and the structural rules that define this VentureScope model.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          <SettingsActionMessage
            state={
              state
            }
          />

          <section className="space-y-5">
            <div>
              <div className="font-medium">
                Company
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                Basic identity used throughout dashboards and reports.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="settings-name">
                  Company name
                </Label>

                <Input
                  id="settings-name"
                  name="name"
                  defaultValue={
                    project.name
                  }
                  required
                />

                {state.errors
                  ?.name?.[0] ? (
                  <p className="text-sm text-destructive">
                    {
                      state.errors
                        .name[0]
                    }
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="settings-industry">
                  Industry
                </Label>

                <Input
                  id="settings-industry"
                  name="industry"
                  defaultValue={
                    project.industry ??
                    ""
                  }
                  placeholder="B2B SaaS"
                />

                {state.errors
                  ?.industry?.[0] ? (
                  <p className="text-sm text-destructive">
                    {
                      state.errors
                        .industry[0]
                    }
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="border-t pt-7">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                <CalendarRange
                  className="size-4"
                  aria-hidden="true"
                />
              </div>

              <div>
                <div className="font-medium">
                  Forecast structure
                </div>

                <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
                  VentureScope blocks a forecast-window change if it would leave existing financing events or monthly overrides outside the model.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="settings-start-month">
                  Forecast start month
                </Label>

                <Input
                  id="settings-start-month"
                  name="startMonth"
                  type="month"
                  defaultValue={
                    startMonth
                  }
                  required
                />

                {state.errors
                  ?.startMonth?.[0] ? (
                  <p className="text-sm text-destructive">
                    {
                      state.errors
                        .startMonth[0]
                    }
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="settings-horizon">
                  Forecast horizon
                </Label>

                <select
                  id="settings-horizon"
                  name="horizonMonths"
                  defaultValue={
                    String(
                      project.horizonMonths,
                    )
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {PROJECT_HORIZONS.map(
                    (
                      horizon,
                    ) => (
                      <option
                        key={
                          horizon
                        }
                        value={
                          horizon
                        }
                      >
                        {
                          horizon
                        }{" "}
                        months
                      </option>
                    ),
                  )}
                </select>

                {state.errors
                  ?.horizonMonths?.[0] ? (
                  <p className="text-sm text-destructive">
                    {
                      state.errors
                        .horizonMonths[0]
                    }
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="border-t pt-7">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                <Coins
                  className="size-4"
                  aria-hidden="true"
                />
              </div>

              <div>
                <div className="font-medium">
                  Reporting currency
                </div>

                <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
                  Changing currency changes the reporting label only. VentureScope does not convert existing monetary assumptions or forecast values.
                </p>
              </div>
            </div>

            <div className="max-w-md space-y-2">
              <Label htmlFor="settings-currency">
                Currency
              </Label>

              <select
                id="settings-currency"
                name="currency"
                defaultValue={
                  project.currency
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {PROJECT_CURRENCIES.map(
                  (
                    currency,
                  ) => (
                    <option
                      key={
                        currency.value
                      }
                      value={
                        currency.value
                      }
                    >
                      {
                        currency.symbol
                      }{" "}
                      {
                        currency.value
                      }{" "}
                      —{" "}
                      {
                        currency.label
                      }
                    </option>
                  ),
                )}
              </select>

              {state.errors
                ?.currency?.[0] ? (
                <p className="text-sm text-destructive">
                  {
                    state.errors
                      .currency[0]
                  }
                </p>
              ) : null}
            </div>
          </section>

          <section className="border-t pt-7">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                <TrendingUp
                  className="size-4"
                  aria-hidden="true"
                />
              </div>

              <div>
                <div className="font-medium">
                  Revenue engine
                </div>

                <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">
                  Both revenue assumption sets are preserved. If you change the revenue engine, VentureScope marks the Revenue section incomplete until you review and save the newly active assumptions.
                </p>
              </div>
            </div>

            <div className="max-w-xl space-y-2">
              <Label htmlFor="settings-revenue-mode">
                Revenue model
              </Label>

              <select
                id="settings-revenue-mode"
                name="revenueMode"
                defaultValue={
                  project.revenueMode
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {REVENUE_MODE_OPTIONS.map(
                  (
                    option,
                  ) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {
                        option.title
                      }
                    </option>
                  ),
                )}
              </select>

              {state.errors
                ?.revenueMode?.[0] ? (
                <p className="text-sm text-destructive">
                  {
                    state.errors
                      .revenueMode[0]
                  }
                </p>
              ) : null}
            </div>
          </section>

          <div className="rounded-xl border bg-muted/20 p-4">
            <div className="flex items-start gap-3">
              <Database
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />

              <p className="text-xs leading-5 text-muted-foreground">
                Structural changes never silently delete financing events, monthly overrides or scenario definitions. Incompatible changes are blocked until the affected planning data is explicitly resolved.
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="justify-end border-t py-5">
          <SettingsSubmitButton />
        </CardFooter>
      </Card>
    </form>
  );
}
