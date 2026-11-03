"use client";

import { FieldError } from "@/components/forms/field-error";
import {
  Input,
} from "@/components/ui/input";
import {
  Label,
} from "@/components/ui/label";
import type {
  MonthlyOverrideValues,
  RevenueMode,
} from "@/lib/finance/types";
import { fieldErrorProps } from "@/lib/forms/field-errors";

type MonthlyOverrideFieldsProps = {
  currency: string;

  revenueMode: RevenueMode;

  defaults: MonthlyOverrideValues;

  errors?: Record<
    string,
    string[] | undefined
  >;
};

export function MonthlyOverrideFields({
  currency,
  revenueMode,
  defaults,
  errors,
}: MonthlyOverrideFieldsProps) {
  const customerDriven =
    revenueMode ===
    "CUSTOMER_DRIVEN";

  return (
    <div className="space-y-7">
      <div>
        <div className="font-medium">
          Monthly financial overrides
        </div>

        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Leave a field blank to keep the normal forecast value for that month.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <OverrideField
          id="override-revenue"
          name="revenue"
          label="Revenue"
          prefix={
            currency
          }
          defaultValue={
            defaults.revenue ??
            ""
          }
          help="Force total recognized revenue for this month."
          error={
            errors
              ?.revenue?.[0]
          }
        />

        <OverrideField
          id="override-marketing"
          name="marketing"
          label="Marketing"
          prefix={
            currency
          }
          defaultValue={
            defaults.marketing ??
            ""
          }
          help="Replace the monthly marketing budget."
          error={
            errors
              ?.marketing?.[0]
          }
        />

        <OverrideField
          id="override-salaries"
          name="salaries"
          label="Salaries"
          prefix={
            currency
          }
          defaultValue={
            defaults.salaries ??
            ""
          }
          help="Replace total payroll for this month."
          error={
            errors
              ?.salaries?.[0]
          }
        />

        <OverrideField
          id="override-rent"
          name="rent"
          label="Rent"
          prefix={
            currency
          }
          defaultValue={
            defaults.rent ??
            ""
          }
          help="Replace rent expense for this month."
          error={
            errors
              ?.rent?.[0]
          }
        />

        <OverrideField
          id="override-cogs"
          name="cogs"
          label="COGS"
          prefix={
            currency
          }
          defaultValue={
            defaults.cogs ??
            ""
          }
          help="Force an absolute COGS amount for this month."
          error={
            errors
              ?.cogs?.[0]
          }
        />

        {customerDriven ? (
          <>
            <OverrideField
              id="override-cac"
              name="cac"
              label="CAC"
              prefix={
                currency
              }
              min="0.01"
              defaultValue={
                defaults.cac ??
                ""
              }
              help="Replace paid customer acquisition cost for this month."
              error={
                errors
                  ?.cac?.[0]
              }
            />

            <OverrideField
              id="override-churn"
              name="churnRate"
              label="Churn"
              suffix="%"
              min="0"
              max="100"
              defaultValue={
                defaults.churnRate ??
                ""
              }
              help="Replace monthly customer churn for this month."
              error={
                errors
                  ?.churnRate?.[0]
              }
            />

            <OverrideField
              id="override-arpu"
              name="arpu"
              label="ARPU"
              prefix={
                currency
              }
              defaultValue={
                defaults.arpu ??
                ""
              }
              help="Replace ARPU for this month."
              error={
                errors
                  ?.arpu?.[0]
              }
            />
          </>
        ) : (
          <>
            <input
              type="hidden"
              name="cac"
              value=""
            />

            <input
              type="hidden"
              name="churnRate"
              value=""
            />

            <input
              type="hidden"
              name="arpu"
              value=""
            />
          </>
        )}
      </div>
    </div>
  );
}

function OverrideField({
  id,
  name,
  label,
  prefix,
  suffix,
  defaultValue,
  min = "0",
  max,
  help,
  error,
}: {
  id: string;

  name: string;

  label: string;

  prefix?: string;

  suffix?: string;

  defaultValue: string;

  min?: string;

  max?: string;

  help: string;

  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {
          label
        }
      </Label>

      <div className="relative">
        {prefix ? (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
            {
              prefix
            }
          </span>
        ) : null}

        <Input
          id={id}
          name={name}
          {...fieldErrorProps(id, error)}
          type="number"
          min={min}
          max={max}
          step="0.01"
          defaultValue={
            defaultValue
          }
          placeholder="No override"
          className={
            prefix
              ? "pl-14"
              : suffix
                ? "pr-10"
                : undefined
          }
        />

        {suffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {
              suffix
            }
          </span>
        ) : null}
      </div>

      <p className="text-xs leading-5 text-muted-foreground">
        {
          help
        }
      </p>

      <FieldError fieldId={id} message={error} />
    </div>
  );
}
