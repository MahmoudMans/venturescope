"use client";

import {
  Banknote,
  BriefcaseBusiness,
  Megaphone,
  PackageOpen,
  Plus,
  ReceiptText,
  Trash2,
} from "lucide-react";
import {
  useActionState,
  useState,
} from "react";

import {
  saveExpenseAssumptionsAction,
} from "@/app/(app)/projects/assumption-actions";
import {
  AssumptionActionMessage,
} from "@/components/assumptions/assumption-action-message";
import {
  AssumptionSaveButton,
} from "@/components/assumptions/assumption-save-button";
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
  initialAssumptionActionState,
} from "@/lib/finance/assumptions/action-state";
import type {
  CogsMethod,
  CustomOperatingExpense,
  ExpenseAssumptions,
  GrowthPeriod,
} from "@/lib/finance/assumptions/types";
import {
  cn,
} from "@/lib/utils";

type ExpenseAssumptionsFormProps = {
  projectId: string;
  currency: string;
  assumptions: ExpenseAssumptions;
};

export function ExpenseAssumptionsForm({
  projectId,
  currency,
  assumptions,
}: ExpenseAssumptionsFormProps) {
  const [
    state,
    action,
  ] = useActionState(
    saveExpenseAssumptionsAction,
    initialAssumptionActionState,
  );

  const [
    cogsMethod,
    setCogsMethod,
  ] =
    useState<CogsMethod>(
      assumptions.cogs.method,
    );

  const [
    marketingGrowthPeriod,
    setMarketingGrowthPeriod,
  ] =
    useState<GrowthPeriod>(
      assumptions.marketing
        .growthPeriod,
    );

  const [
    customExpenses,
    setCustomExpenses,
  ] = useState<
    CustomOperatingExpense[]
  >(
    assumptions.operatingExpenses
      .custom,
  );

  function addCustomExpense() {
    if (
      customExpenses.length >=
      20
    ) {
      return;
    }

    setCustomExpenses(
      (
        current,
      ) => [
        ...current,
        {
          id:
            crypto.randomUUID(),
          name: "",
          monthlyAmount:
            "0",
        },
      ],
    );
  }

  function updateCustomExpense(
    id: string,
    field:
      | "name"
      | "monthlyAmount",
    value: string,
  ) {
    setCustomExpenses(
      (
        current,
      ) =>
        current.map(
          (
            expense,
          ) =>
            expense.id ===
            id
              ? {
                  ...expense,
                  [field]:
                    value,
                }
              : expense,
        ),
    );
  }

  function removeCustomExpense(
    id: string,
  ) {
    setCustomExpenses(
      (
        current,
      ) =>
        current.filter(
          (
            expense,
          ) =>
            expense.id !==
            id,
        ),
    );
  }

  return (
    <form
      action={action}
      className="space-y-6"
    >
      <input
        type="hidden"
        name="projectId"
        value={projectId}
      />

      <input
        type="hidden"
        name="cogsMethod"
        value={cogsMethod}
      />

      <input
        type="hidden"
        name="marketingGrowthPeriod"
        value={
          marketingGrowthPeriod
        }
      />

      <AssumptionActionMessage
        state={state}
      />

      <Card className="border-border/70">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>
                Salaries
              </CardTitle>

              <CardDescription className="mt-1">
                Monthly payroll and annual salary growth.
              </CardDescription>
            </div>

            <BriefcaseBusiness
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        </CardHeader>

        <CardContent className="grid gap-6 md:grid-cols-2">
          <ExpenseField
            id="salariesMonthly"
            name="salariesMonthly"
            label="Monthly salaries"
            currency={currency}
            defaultValue={
              assumptions.salaries
                .monthlyAmount
            }
            min="-0"
            error={
              state.errors
                ?.salariesMonthly?.[0]
            }
          />

          <ExpenseField
            id="salaryAnnualGrowthRate"
            name="salaryAnnualGrowthRate"
            label="Annual salary growth"
            suffix="% / year"
            defaultValue={
              assumptions.salaries
                .annualGrowthRate
            }
            min="-100"
            error={
              state.errors
                ?.salaryAnnualGrowthRate?.[0]
            }
          />
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>
                Rent
              </CardTitle>

              <CardDescription className="mt-1">
                Monthly premises cost and expected annual increase.
              </CardDescription>
            </div>

            <Banknote
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        </CardHeader>

        <CardContent className="grid gap-6 md:grid-cols-2">
          <ExpenseField
            id="rentMonthly"
            name="rentMonthly"
            label="Monthly rent"
            currency={currency}
            defaultValue={
              assumptions.rent
                .monthlyAmount
            }
            min="0"
            error={
              state.errors
                ?.rentMonthly?.[0]
            }
          />

          <ExpenseField
            id="rentAnnualGrowthRate"
            name="rentAnnualGrowthRate"
            label="Annual rent increase"
            suffix="% / year"
            defaultValue={
              assumptions.rent
                .annualGrowthRate
            }
            min="-100"
            error={
              state.errors
                ?.rentAnnualGrowthRate?.[0]
            }
          />
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>
                Marketing
              </CardTitle>

              <CardDescription className="mt-1">
                This is the single marketing budget used for both operating expenses and future paid-customer acquisition.
              </CardDescription>
            </div>

            <Megaphone
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ExpenseField
              id="marketingMonthly"
              name="marketingMonthly"
              label="Monthly marketing budget"
              currency={currency}
              defaultValue={
                assumptions.marketing
                  .monthlyAmount
              }
              min="0"
              error={
                state.errors
                  ?.marketingMonthly?.[0]
              }
            />

            <ExpenseField
              id="marketingGrowthRate"
              name="marketingGrowthRate"
              label="Marketing growth"
              suffix="%"
              defaultValue={
                assumptions.marketing
                  .growthRate
              }
              min="-100"
              error={
                state.errors
                  ?.marketingGrowthRate?.[0]
              }
            />
          </div>

          <div className="space-y-3">
            <Label>
              Growth frequency
            </Label>

            <div className="grid max-w-md grid-cols-2 gap-2">
              {(
                [
                  "MONTHLY",
                  "ANNUAL",
                ] as const
              ).map(
                (
                  period,
                ) => (
                  <button
                    key={
                      period
                    }
                    type="button"
                    onClick={() =>
                      setMarketingGrowthPeriod(
                        period,
                      )
                    }
                    className={cn(
                      "rounded-xl border px-4 py-3 text-sm font-medium",
                      marketingGrowthPeriod ===
                        period
                        ? "border-foreground bg-foreground text-background"
                        : "hover:bg-muted",
                    )}
                  >
                    {period ===
                    "MONTHLY"
                      ? "Monthly"
                      : "Annual"}
                  </button>
                ),
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>
                Cost of goods sold
              </CardTitle>

              <CardDescription className="mt-1">
                Choose percentage-of-revenue or fixed-monthly COGS.
              </CardDescription>
            </div>

            <PackageOpen
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() =>
                setCogsMethod(
                  "PERCENTAGE",
                )
              }
              className={cn(
                "rounded-xl border p-4 text-left",
                cogsMethod ===
                  "PERCENTAGE"
                  ? "border-foreground bg-muted/50"
                  : "hover:bg-muted/30",
              )}
            >
              <div className="font-medium">
                Percentage of revenue
              </div>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                COGS will later vary with revenue.
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                setCogsMethod(
                  "FIXED_MONTHLY",
                )
              }
              className={cn(
                "rounded-xl border p-4 text-left",
                cogsMethod ===
                  "FIXED_MONTHLY"
                  ? "border-foreground bg-muted/50"
                  : "hover:bg-muted/30",
              )}
            >
              <div className="font-medium">
                Fixed monthly
              </div>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                COGS will later use the same monthly amount.
              </p>
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <ExpenseField
              id="cogsPercentage"
              name="cogsPercentage"
              label="COGS percentage"
              suffix="% of revenue"
              defaultValue={
                assumptions.cogs
                  .percentage
              }
              min="0"
              max="100"
              disabled={
                cogsMethod !==
                "PERCENTAGE"
              }
              error={
                state.errors
                  ?.cogsPercentage?.[0]
              }
            />

            <ExpenseField
              id="cogsFixedMonthly"
              name="cogsFixedMonthly"
              label="Fixed monthly COGS"
              currency={currency}
              defaultValue={
                assumptions.cogs
                  .fixedMonthlyAmount
              }
              min="0"
              disabled={
                cogsMethod !==
                "FIXED_MONTHLY"
              }
              error={
                state.errors
                  ?.cogsFixedMonthly?.[0]
              }
            />
          </div>

          {cogsMethod ===
          "PERCENTAGE" ? (
            <input
              type="hidden"
              name="cogsFixedMonthly"
              value={
                assumptions.cogs
                  .fixedMonthlyAmount
              }
            />
          ) : (
            <input
              type="hidden"
              name="cogsPercentage"
              value={
                assumptions.cogs
                  .percentage
              }
            />
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>
                Operating expenses
              </CardTitle>

              <CardDescription className="mt-1">
                Recurring operating costs outside salaries, rent, marketing and COGS.
              </CardDescription>
            </div>

            <ReceiptText
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <ExpenseField
              id="software"
              name="software"
              label="Software"
              currency={currency}
              defaultValue={
                assumptions
                  .operatingExpenses
                  .software
              }
              min="0"
              error={
                state.errors
                  ?.software?.[0]
              }
            />

            <ExpenseField
              id="professionalServices"
              name="professionalServices"
              label="Professional services"
              currency={currency}
              defaultValue={
                assumptions
                  .operatingExpenses
                  .professionalServices
              }
              min="0"
              error={
                state.errors
                  ?.professionalServices?.[0]
              }
            />

            <ExpenseField
              id="insurance"
              name="insurance"
              label="Insurance"
              currency={currency}
              defaultValue={
                assumptions
                  .operatingExpenses
                  .insurance
              }
              min="0"
              error={
                state.errors
                  ?.insurance?.[0]
              }
            />

            <ExpenseField
              id="utilities"
              name="utilities"
              label="Utilities"
              currency={currency}
              defaultValue={
                assumptions
                  .operatingExpenses
                  .utilities
              }
              min="0"
              error={
                state.errors
                  ?.utilities?.[0]
              }
            />

            <ExpenseField
              id="travel"
              name="travel"
              label="Travel"
              currency={currency}
              defaultValue={
                assumptions
                  .operatingExpenses
                  .travel
              }
              min="0"
              error={
                state.errors
                  ?.travel?.[0]
              }
            />

            <ExpenseField
              id="other"
              name="other"
              label="Other"
              currency={currency}
              defaultValue={
                assumptions
                  .operatingExpenses
                  .other
              }
              min="0"
              error={
                state.errors
                  ?.other?.[0]
              }
            />
          </div>

          <div className="border-t pt-7">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="font-medium">
                  Custom categories
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  Add up to 20 additional recurring monthly operating expenses.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={
                  addCustomExpense
                }
                disabled={
                  customExpenses.length >=
                  20
                }
              >
                <Plus
                  className="size-4"
                  aria-hidden="true"
                />

                Add category
              </Button>
            </div>

            {customExpenses.length ===
            0 ? (
              <div className="mt-5 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                No custom operating expenses.
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {customExpenses.map(
                  (
                    expense,
                    index,
                  ) => (
                    <div
                      key={
                        expense.id
                      }
                      className="grid gap-3 rounded-xl border p-4 sm:grid-cols-[minmax(0,1fr)_220px_auto]"
                    >
                      <input
                        type="hidden"
                        name="customExpenseId"
                        value={
                          expense.id
                        }
                      />

                      <div className="space-y-2">
                        <Label
                          htmlFor={`custom-name-${expense.id}`}
                        >
                          Category name
                        </Label>

                        <Input
                          id={`custom-name-${expense.id}`}
                          name="customExpenseName"
                          value={
                            expense.name
                          }
                          onChange={(
                            event,
                          ) =>
                            updateCustomExpense(
                              expense.id,
                              "name",
                              event
                                .target
                                .value,
                            )
                          }
                          placeholder={`Custom expense ${index + 1}`}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor={`custom-amount-${expense.id}`}
                        >
                          Monthly amount
                        </Label>

                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                            {
                              currency
                            }
                          </span>

                          <Input
                            id={`custom-amount-${expense.id}`}
                            name="customExpenseMonthlyAmount"
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              expense.monthlyAmount
                            }
                            onChange={(
                              event,
                            ) =>
                              updateCustomExpense(
                                expense.id,
                                "monthlyAmount",
                                event
                                  .target
                                  .value,
                              )
                            }
                            className="pl-14"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove ${expense.name || "custom expense"}`}
                          onClick={() =>
                            removeCustomExpense(
                              expense.id,
                            )
                          }
                        >
                          <Trash2
                            className="size-4"
                            aria-hidden="true"
                          />
                        </Button>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}

            {state.errors
              ?.customExpenses?.[0] ? (
              <p className="mt-3 text-sm text-destructive">
                {
                  state.errors
                    .customExpenses[0]
                }
              </p>
            ) : null}
          </div>
        </CardContent>

        <CardFooter className="justify-end border-t py-5">
          <AssumptionSaveButton
            label="Save expense assumptions"
          />
        </CardFooter>
      </Card>
    </form>
  );
}

type ExpenseFieldProps = {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
  currency?: string;
  suffix?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  error?: string;
};

function ExpenseField({
  id,
  name,
  label,
  defaultValue,
  currency,
  suffix,
  min,
  max,
  disabled = false,
  error,
}: ExpenseFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
      </Label>

      <div className="relative">
        {currency ? (
          <span className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-xs font-medium text-muted-foreground">
            {currency}
          </span>
        ) : null}

        <Input
          id={id}
          name={name}
          type="number"
          min={min}
          max={max}
          step="0.01"
          defaultValue={
            defaultValue
          }
          disabled={
            disabled
          }
          className={cn(
            currency &&
              "pl-14",
            suffix &&
              "pr-24",
          )}
          required={
            !disabled
          }
        />

        {suffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
