"use client";

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  CircleDollarSign,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  useActionState,
  useEffect,
  useState,
} from "react";

import {
  createProjectAction,
} from "@/app/(app)/projects/actions";
import {
  CreateProjectSubmitButton,
} from "@/components/projects/create-project-submit-button";
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
  initialCreateProjectState,
} from "@/lib/projects/action-state";
import {
  PROJECT_CURRENCIES,
  PROJECT_HORIZONS,
  REVENUE_MODE_OPTIONS,
  type RevenueModeValue,
} from "@/lib/projects/project-options";
import {
  cn,
} from "@/lib/utils";

type CreateProjectWizardProps = {
  defaultStartMonth: string;
};

export function CreateProjectWizard({
  defaultStartMonth,
}: CreateProjectWizardProps) {
  const [
    step,
    setStep,
  ] = useState<1 | 2>(1);

  const [
    name,
    setName,
  ] = useState("");

  const [
    industry,
    setIndustry,
  ] = useState("");

  const [
    currency,
    setCurrency,
  ] = useState("EUR");

  const [
    startMonth,
    setStartMonth,
  ] = useState(
    defaultStartMonth,
  );

  const [
    horizonMonths,
    setHorizonMonths,
  ] = useState("36");

  const [
    revenueMode,
    setRevenueMode,
  ] =
    useState<RevenueModeValue>(
      "CUSTOMER_DRIVEN",
    );

  const [
    localError,
    setLocalError,
  ] =
    useState<string>();

  const [
    state,
    formAction,
  ] = useActionState(
    createProjectAction,
    initialCreateProjectState,
  );

  useEffect(() => {
    const errors =
      state.errors;

    if (!errors) {
      return;
    }

    if (
      errors.name ||
      errors.industry ||
      errors.currency ||
      errors.startMonth ||
      errors.horizonMonths
    ) {
      setStep(1);
      return;
    }

    if (
      errors.revenueMode
    ) {
      setStep(2);
    }
  }, [
    state,
  ]);

  function continueToRevenue() {
    setLocalError(
      undefined,
    );

    if (
      name.trim().length < 2
    ) {
      setLocalError(
        "Enter a company name with at least 2 characters.",
      );

      return;
    }

    if (!startMonth) {
      setLocalError(
        "Select a forecast start month.",
      );

      return;
    }

    setStep(2);
  }

  const currentError =
    localError ??
    state.message;

  return (
    <form
      action={formAction}
      className="space-y-6"
    >
      <input
        type="hidden"
        name="name"
        value={name}
      />

      <input
        type="hidden"
        name="industry"
        value={industry}
      />

      <input
        type="hidden"
        name="currency"
        value={currency}
      />

      <input
        type="hidden"
        name="startMonth"
        value={startMonth}
      />

      <input
        type="hidden"
        name="horizonMonths"
        value={horizonMonths}
      />

      <input
        type="hidden"
        name="revenueMode"
        value={revenueMode}
      />

      <div className="grid grid-cols-2 gap-3">
        <StepIndicator
          number={1}
          label="Company"
          active={
            step === 1
          }
          complete={
            step > 1
          }
        />

        <StepIndicator
          number={2}
          label="Revenue model"
          active={
            step === 2
          }
          complete={false}
        />
      </div>

      <Card className="border-border/70 shadow-sm">
        {step === 1 ? (
          <>
            <CardHeader>
              <div className="mb-2 flex items-center justify-between gap-4">
                <Badge variant="outline">
                  Step 1 of 2
                </Badge>

                <Building2
                  className="size-5 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>

              <CardTitle className="text-2xl">
                Company information
              </CardTitle>

              <CardDescription>
                Set the identity and forecast window for this financial model.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {currentError ? (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                >
                  {currentError}
                </div>
              ) : null}

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="project-name">
                    Company name
                  </Label>

                  <Input
                    id="project-name"
                    value={name}
                    onChange={(
                      event,
                    ) => {
                      setName(
                        event
                          .target
                          .value,
                      );

                      setLocalError(
                        undefined,
                      );
                    }}
                    placeholder="Acme Analytics"
                    autoFocus
                  />

                  {state.errors
                    ?.name?.[0] ? (
                    <p className="text-sm text-destructive">
                      {
                        state
                          .errors
                          .name[0]
                      }
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="project-industry">
                    Industry
                    <span className="ml-1 font-normal text-muted-foreground">
                      optional
                    </span>
                  </Label>

                  <Input
                    id="project-industry"
                    value={industry}
                    onChange={(
                      event,
                    ) =>
                      setIndustry(
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="B2B SaaS"
                  />

                  {state.errors
                    ?.industry?.[0] ? (
                    <p className="text-sm text-destructive">
                      {
                        state
                          .errors
                          .industry[0]
                      }
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project-currency">
                    Currency
                  </Label>

                  <select
                    id="project-currency"
                    value={currency}
                    onChange={(
                      event,
                    ) =>
                      setCurrency(
                        event
                          .target
                          .value,
                      )
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    {PROJECT_CURRENCIES.map(
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
                            option.symbol
                          }{" "}
                          {
                            option.value
                          } —{" "}
                          {
                            option.label
                          }
                        </option>
                      ),
                    )}
                  </select>

                  {state.errors
                    ?.currency?.[0] ? (
                    <p className="text-sm text-destructive">
                      {
                        state
                          .errors
                          .currency[0]
                      }
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project-start-month">
                    Forecast start
                  </Label>

                  <Input
                    id="project-start-month"
                    type="month"
                    value={startMonth}
                    onChange={(
                      event,
                    ) =>
                      setStartMonth(
                        event
                          .target
                          .value,
                      )
                    }
                  />

                  {state.errors
                    ?.startMonth?.[0] ? (
                    <p className="text-sm text-destructive">
                      {
                        state
                          .errors
                          .startMonth[0]
                      }
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>
                    Forecast horizon
                  </Label>

                  <p className="mt-1 text-xs text-muted-foreground">
                    You can model between 12 and 60 months.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {PROJECT_HORIZONS.map(
                    (
                      horizon,
                    ) => {
                      const active =
                        horizonMonths ===
                        String(
                          horizon,
                        );

                      return (
                        <button
                          key={
                            horizon
                          }
                          type="button"
                          onClick={() =>
                            setHorizonMonths(
                              String(
                                horizon,
                              ),
                            )
                          }
                          className={cn(
                            "rounded-xl border px-3 py-4 text-center transition-colors",
                            active
                              ? "border-foreground bg-foreground text-background"
                              : "border-border bg-background hover:bg-muted",
                          )}
                        >
                          <div className="text-lg font-semibold">
                            {
                              horizon
                            }
                          </div>

                          <div
                            className={cn(
                              "mt-1 text-[10px] uppercase tracking-[0.12em]",
                              active
                                ? "text-background/70"
                                : "text-muted-foreground",
                            )}
                          >
                            months
                          </div>
                        </button>
                      );
                    },
                  )}
                </div>

                {state.errors
                  ?.horizonMonths?.[0] ? (
                  <p className="text-sm text-destructive">
                    {
                      state
                        .errors
                        .horizonMonths[0]
                    }
                  </p>
                ) : null}
              </div>

              <div className="grid gap-3 rounded-xl border bg-muted/30 p-4 text-sm sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <CircleDollarSign
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />

                  One currency/model
                </div>

                <div className="flex items-center gap-2">
                  <CalendarDays
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />

                  Monthly forecast
                </div>

                <div className="flex items-center gap-2">
                  <TrendingUp
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />

                  Scenario-ready
                </div>
              </div>
            </CardContent>

            <CardFooter className="justify-end border-t py-5">
              <Button
                type="button"
                size="lg"
                onClick={
                  continueToRevenue
                }
              >
                Continue

                <ArrowRight
                  className="size-4"
                  aria-hidden="true"
                />
              </Button>
            </CardFooter>
          </>
        ) : (
          <>
            <CardHeader>
              <div className="mb-2 flex items-center justify-between gap-4">
                <Badge variant="outline">
                  Step 2 of 2
                </Badge>

                <TrendingUp
                  className="size-5 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>

              <CardTitle className="text-2xl">
                Revenue model
              </CardTitle>

              <CardDescription>
                Choose how VentureScope will eventually generate revenue forecasts.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {state.message ? (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                >
                  {
                    state.message
                  }
                </div>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-2">
                {REVENUE_MODE_OPTIONS.map(
                  (
                    option,
                  ) => {
                    const selected =
                      revenueMode ===
                      option.value;

                    const Icon =
                      option.value ===
                      "DIRECT"
                        ? TrendingUp
                        : Users;

                    return (
                      <button
                        key={
                          option.value
                        }
                        type="button"
                        aria-pressed={
                          selected
                        }
                        onClick={() =>
                          setRevenueMode(
                            option.value,
                          )
                        }
                        className={cn(
                          "relative rounded-2xl border p-6 text-left transition-all",
                          selected
                            ? "border-foreground bg-muted/50 shadow-sm"
                            : "border-border hover:border-foreground/30 hover:bg-muted/30",
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex size-11 items-center justify-center rounded-xl bg-foreground text-background">
                            <Icon
                              className="size-5"
                              aria-hidden="true"
                            />
                          </div>

                          <div
                            className={cn(
                              "flex size-6 items-center justify-center rounded-full border",
                              selected
                                ? "border-foreground bg-foreground text-background"
                                : "border-border",
                            )}
                          >
                            {selected ? (
                              <Check
                                className="size-3.5"
                                aria-hidden="true"
                              />
                            ) : null}
                          </div>
                        </div>

                        <h3 className="mt-6 text-lg font-semibold">
                          {
                            option.title
                          }
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {
                            option.description
                          }
                        </p>

                        <div className="mt-5 text-xs font-medium text-muted-foreground">
                          {option.value ===
                          "DIRECT"
                            ? "Revenue + growth + recurring share"
                            : "Customers + ARPU + churn + CAC"}
                        </div>
                      </button>
                    );
                  },
                )}
              </div>

              {state.errors
                ?.revenueMode?.[0] ? (
                <p className="text-sm text-destructive">
                  {
                    state
                      .errors
                      .revenueMode[0]
                  }
                </p>
              ) : null}

              <div className="rounded-xl border bg-muted/30 p-5">
                <div className="text-sm font-medium">
                  VentureScope will also initialize
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      label:
                        "Base Case",
                      description:
                        "Your exact assumptions",
                    },
                    {
                      label:
                        "Bull Case",
                      description:
                        "Optimistic modifiers",
                    },
                    {
                      label:
                        "Bear Case",
                      description:
                        "Stress-case modifiers",
                    },
                  ].map(
                    (
                      scenario,
                    ) => (
                      <div
                        key={
                          scenario.label
                        }
                        className="rounded-lg border bg-background p-3"
                      >
                        <div className="text-sm font-medium">
                          {
                            scenario.label
                          }
                        </div>

                        <div className="mt-1 text-xs text-muted-foreground">
                          {
                            scenario.description
                          }
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex-col gap-3 border-t py-5 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() =>
                  setStep(1)
                }
              >
                <ArrowLeft
                  className="size-4"
                  aria-hidden="true"
                />

                Back
              </Button>

              <CreateProjectSubmitButton />
            </CardFooter>
          </>
        )}
      </Card>
    </form>
  );
}

type StepIndicatorProps = {
  number: number;
  label: string;
  active: boolean;
  complete: boolean;
};

function StepIndicator({
  number,
  label,
  active,
  complete,
}: StepIndicatorProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3 transition-colors",
        active
          ? "border-foreground bg-muted/50"
          : "border-border",
      )}
    >
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
          active ||
            complete
            ? "border-foreground bg-foreground text-background"
            : "border-border text-muted-foreground",
        )}
      >
        {complete ? (
          <Check
            className="size-4"
            aria-hidden="true"
          />
        ) : (
          number
        )}
      </div>

      <div>
        <div className="text-xs text-muted-foreground">
          Step {number}
        </div>

        <div className="text-sm font-medium">
          {label}
        </div>
      </div>
    </div>
  );
}
