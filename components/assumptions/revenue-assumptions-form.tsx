"use client";

import {
  CircleDollarSign,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import {
  useActionState,
} from "react";

import {
  saveRevenueAssumptionsAction,
} from "@/app/(app)/projects/assumption-actions";
import {
  AssumptionActionMessage,
} from "@/components/assumptions/assumption-action-message";
import {
  AssumptionSaveButton,
} from "@/components/assumptions/assumption-save-button";
import {
  Badge,
} from "@/components/ui/badge";
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
  CustomerRevenueAssumptions,
  DirectRevenueAssumptions,
} from "@/lib/finance/assumptions/types";

type RevenueAssumptionsFormProps = {
  projectId: string;
  currency: string;

  revenueMode:
    | "DIRECT"
    | "CUSTOMER_DRIVEN";

  directAssumptions: DirectRevenueAssumptions;

  customerAssumptions: CustomerRevenueAssumptions;

  marketingMonthlyAmount: string;
};

export function RevenueAssumptionsForm({
  projectId,
  currency,
  revenueMode,
  directAssumptions,
  customerAssumptions,
  marketingMonthlyAmount,
}: RevenueAssumptionsFormProps) {
  const [
    state,
    action,
  ] = useActionState(
    saveRevenueAssumptionsAction,
    initialAssumptionActionState,
  );

  const direct =
    revenueMode ===
    "DIRECT";

  return (
    <form
      action={action}
    >
      <input
        type="hidden"
        name="projectId"
        value={projectId}
      />

      <Card className="border-border/70">
        <CardHeader>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <div className="mb-3">
                <Badge>
                  {direct
                    ? "DIRECT REVENUE"
                    : "CUSTOMER-DRIVEN"}
                </Badge>
              </div>

              <CardTitle>
                {direct
                  ? "Direct revenue assumptions"
                  : "Customer-driven revenue assumptions"}
              </CardTitle>

              <CardDescription className="mt-1 max-w-2xl">
                {direct
                  ? "Revenue will later be forecast directly from the starting monthly revenue and growth assumptions."
                  : "Revenue will later be generated from customer acquisition, churn and ARPU."}
              </CardDescription>
            </div>

            {direct ? (
              <TrendingUp
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
            ) : (
              <Users
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-7">
          <AssumptionActionMessage
            state={state}
          />

          {direct ? (
            <DirectFields
              currency={currency}
              assumptions={
                directAssumptions
              }
              errors={
                state.errors
              }
            />
          ) : (
            <CustomerFields
              projectId={
                projectId
              }
              currency={
                currency
              }
              assumptions={
                customerAssumptions
              }
              marketingMonthlyAmount={
                marketingMonthlyAmount
              }
              errors={
                state.errors
              }
            />
          )}
        </CardContent>

        <CardFooter className="justify-end border-t py-5">
          <AssumptionSaveButton
            label="Save revenue assumptions"
          />
        </CardFooter>
      </Card>
    </form>
  );
}

function DirectFields({
  currency,
  assumptions,
  errors,
}: {
  currency: string;
  assumptions: DirectRevenueAssumptions;
  errors?: Record<
    string,
    string[] | undefined
  >;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <FinancialField
        id="startingMonthlyRevenue"
        name="startingMonthlyRevenue"
        label="Starting monthly revenue"
        defaultValue={
          assumptions.startingMonthlyRevenue
        }
        prefix={currency}
        min="0"
        step="0.01"
        help="Revenue generated in the first forecast month."
        error={
          errors
            ?.startingMonthlyRevenue?.[0]
        }
      />

      <FinancialField
        id="monthlyGrowthRate"
        name="monthlyGrowthRate"
        label="Monthly revenue growth"
        defaultValue={
          assumptions.monthlyGrowthRate
        }
        suffix="%"
        min="-100"
        step="0.01"
        help="Negative values are allowed down to -100%."
        error={
          errors
            ?.monthlyGrowthRate?.[0]
        }
      />

      <FinancialField
        id="recurringRevenuePercentage"
        name="recurringRevenuePercentage"
        label="Recurring revenue share"
        defaultValue={
          assumptions.recurringRevenuePercentage
        }
        suffix="%"
        min="0"
        max="100"
        step="0.01"
        help="Share of monthly revenue that will contribute to MRR."
        error={
          errors
            ?.recurringRevenuePercentage?.[0]
        }
      />

      <FinancialField
        id="monthlyOneTimeRevenue"
        name="monthlyOneTimeRevenue"
        label="Monthly one-time revenue"
        defaultValue={
          assumptions.monthlyOneTimeRevenue
        }
        prefix={currency}
        min="0"
        step="0.01"
        help="Optional non-recurring revenue added to each forecast month."
        error={
          errors
            ?.monthlyOneTimeRevenue?.[0]
        }
      />
    </div>
  );
}

function CustomerFields({
  projectId,
  currency,
  assumptions,
  marketingMonthlyAmount,
  errors,
}: {
  projectId: string;
  currency: string;
  assumptions: CustomerRevenueAssumptions;
  marketingMonthlyAmount: string;

  errors?: Record<
    string,
    string[] | undefined
  >;
}) {
  return (
    <>
      <div className="rounded-xl border bg-muted/30 p-5">
        <div className="flex items-start gap-3">
          <CircleDollarSign
            className="mt-0.5 size-5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />

          <div>
            <div className="text-sm font-medium">
              Marketing budget has one source of truth
            </div>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Customer acquisition will later use the monthly
              marketing budget configured under Expenses.
              The current value is{" "}
              <strong className="font-medium text-foreground">
                {currency}{" "}
                {
                  marketingMonthlyAmount
                }
              </strong>
              .
            </p>

            <Link
              href={`/projects/${projectId}/expenses`}
              className="mt-2 inline-block text-sm font-medium underline underline-offset-4"
            >
              Configure marketing expenses
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <FinancialField
          id="startingCustomers"
          name="startingCustomers"
          label="Starting customers"
          defaultValue={
            assumptions.startingCustomers
          }
          min="0"
          step="1"
          help="Active customers at the beginning of the forecast."
          error={
            errors
              ?.startingCustomers?.[0]
          }
        />

        <FinancialField
          id="arpu"
          name="arpu"
          label="Average revenue per customer"
          defaultValue={
            assumptions.arpu
          }
          prefix={currency}
          min="0"
          step="0.01"
          help="Monthly average revenue per active customer."
          error={
            errors?.arpu?.[0]
          }
        />

        <FinancialField
          id="monthlyChurnRate"
          name="monthlyChurnRate"
          label="Monthly churn"
          defaultValue={
            assumptions.monthlyChurnRate
          }
          suffix="%"
          min="0"
          max="100"
          step="0.01"
          help="Percentage of opening customers expected to churn each month."
          error={
            errors
              ?.monthlyChurnRate?.[0]
          }
        />

        <FinancialField
          id="cac"
          name="cac"
          label="Customer acquisition cost"
          defaultValue={
            assumptions.cac
          }
          prefix={currency}
          min="0.01"
          step="0.01"
          help="Paid acquisition cost per new customer."
          error={
            errors?.cac?.[0]
          }
        />

        <FinancialField
          id="organicNewCustomers"
          name="organicNewCustomers"
          label="Organic new customers / month"
          defaultValue={
            assumptions.organicNewCustomers
          }
          min="0"
          step="1"
          help="New customers acquired without paid marketing."
          error={
            errors
              ?.organicNewCustomers?.[0]
          }
        />

        <FinancialField
          id="customerAcquisitionGrowthRate"
          name="customerAcquisitionGrowthRate"
          label="Customer acquisition growth"
          defaultValue={
            assumptions.customerAcquisitionGrowthRate
          }
          suffix="% / month"
          min="-100"
          step="0.01"
          help="Monthly growth applied to customer acquisition."
          error={
            errors
              ?.customerAcquisitionGrowthRate?.[0]
          }
        />

        <FinancialField
          id="arpuGrowthRate"
          name="arpuGrowthRate"
          label="ARPU growth"
          defaultValue={
            assumptions.arpuGrowthRate
          }
          suffix="% / month"
          min="-100"
          step="0.01"
          help="Monthly growth or decline in ARPU."
          error={
            errors
              ?.arpuGrowthRate?.[0]
          }
        />

        <FinancialField
          id="monthlyOneTimeRevenue"
          name="monthlyOneTimeRevenue"
          label="Monthly one-time revenue"
          defaultValue={
            assumptions.monthlyOneTimeRevenue
          }
          prefix={currency}
          min="0"
          step="0.01"
          help="Optional non-recurring revenue outside customer MRR."
          error={
            errors
              ?.monthlyOneTimeRevenue?.[0]
          }
        />
      </div>
    </>
  );
}

type FinancialFieldProps = {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
  prefix?: string;
  suffix?: string;
  min?: string;
  max?: string;
  step?: string;
  help: string;
  error?: string;
};

function FinancialField({
  id,
  name,
  label,
  defaultValue,
  prefix,
  suffix,
  min,
  max,
  step = "0.01",
  help,
  error,
}: FinancialFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
      </Label>

      <div className="relative">
        {prefix ? (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
            {prefix}
          </span>
        ) : null}

        <Input
          id={id}
          name={name}
          type="number"
          defaultValue={
            defaultValue
          }
          min={min}
          max={max}
          step={step}
          className={
            prefix
              ? "pl-14"
              : suffix
                ? "pr-24"
                : undefined
          }
          required
        />

        {suffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </div>

      <p className="text-xs leading-5 text-muted-foreground">
        {help}
      </p>

      {error ? (
        <p className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
