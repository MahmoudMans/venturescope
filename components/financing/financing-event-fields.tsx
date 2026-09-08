"use client";

import {
  Landmark,
} from "lucide-react";
import {
  useState,
} from "react";

import {
  Input,
} from "@/components/ui/input";
import {
  Label,
} from "@/components/ui/label";
import {
  addMonths,
  compareMonths,
} from "@/lib/finance/dates";
import type {
  MonthKey,
} from "@/lib/finance/types";
import {
  financingTypeDescription,
} from "@/lib/financing/formatting";
import type {
  FinancingEventType,
} from "@/lib/financing/types";

export type FinancingFieldDefaults = {
  name: string;

  type:
    FinancingEventType;

  month: string;

  amount: string;

  apr: string;

  termMonths: string;

  repaymentStartMonth: string;
};

type FinancingEventFieldsProps = {
  idPrefix: string;

  currency: string;

  projectStartMonth: string;

  projectEndMonth: string;

  defaults: FinancingFieldDefaults;

  errors?: Record<
    string,
    string[] | undefined
  >;
};

export function FinancingEventFields({
  idPrefix,
  currency,
  projectStartMonth,
  projectEndMonth,
  defaults,
  errors,
}: FinancingEventFieldsProps) {
  const [
    type,
    setType,
  ] =
    useState<FinancingEventType>(
      defaults.type,
    );

  const [
    month,
    setMonth,
  ] = useState(
    defaults.month,
  );

  const [
    repaymentStartMonth,
    setRepaymentStartMonth,
  ] = useState(
    defaults.repaymentStartMonth,
  );

  function handleTypeChange(
    nextType:
      FinancingEventType,
  ) {
    setType(
      nextType,
    );

    if (
      nextType ===
        "DEBT" &&
      !repaymentStartMonth
    ) {
      setRepaymentStartMonth(
        addMonths(
          month as MonthKey,
          1,
        ),
      );
    }
  }

  function handleMonthChange(
    nextMonth: string,
  ) {
    setMonth(
      nextMonth,
    );

    if (
      type !==
      "DEBT"
    ) {
      return;
    }

    const earliest =
      addMonths(
        nextMonth as MonthKey,
        1,
      );

    if (
      !repaymentStartMonth ||
      compareMonths(
        repaymentStartMonth as MonthKey,
        earliest,
      ) <
        0
    ) {
      setRepaymentStartMonth(
        earliest,
      );
    }
  }

  const debt =
    type ===
    "DEBT";

  const earliestRepayment =
    addMonths(
      month as MonthKey,
      1,
    );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label
            htmlFor={`${idPrefix}-name`}
          >
            Financing name
          </Label>

          <Input
            id={`${idPrefix}-name`}
            name="name"
            defaultValue={
              defaults.name
            }
            placeholder="Seed Round"
            required
          />

          {errors
            ?.name?.[0] ? (
            <p className="text-sm text-destructive">
              {
                errors
                  .name[0]
              }
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor={`${idPrefix}-type`}
          >
            Financing type
          </Label>

          <select
            id={`${idPrefix}-type`}
            name="type"
            value={
              type
            }
            onChange={(
              event,
            ) =>
              handleTypeChange(
                event
                  .target
                  .value as FinancingEventType,
              )
            }
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="EQUITY">
              Equity
            </option>

            <option value="DEBT">
              Debt
            </option>

            <option value="GRANT">
              Grant
            </option>

            <option value="OTHER">
              Other
            </option>
          </select>

          <p className="text-xs leading-5 text-muted-foreground">
            {
              financingTypeDescription(
                type,
              )
            }
          </p>

          {errors
            ?.type?.[0] ? (
            <p className="text-sm text-destructive">
              {
                errors
                  .type[0]
              }
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor={`${idPrefix}-month`}
          >
            Funding month
          </Label>

          <Input
            id={`${idPrefix}-month`}
            name="month"
            type="month"
            min={
              projectStartMonth
            }
            max={
              projectEndMonth
            }
            value={
              month
            }
            onChange={(
              event,
            ) =>
              handleMonthChange(
                event
                  .target
                  .value,
              )
            }
            required
          />

          <p className="text-xs leading-5 text-muted-foreground">
            Must fall inside the project forecast horizon.
          </p>

          {errors
            ?.month?.[0] ? (
            <p className="text-sm text-destructive">
              {
                errors
                  .month[0]
              }
            </p>
          ) : null}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label
            htmlFor={`${idPrefix}-amount`}
          >
            Financing amount
          </Label>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
              {
                currency
              }
            </span>

            <Input
              id={`${idPrefix}-amount`}
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              defaultValue={
                defaults.amount
              }
              className="pl-14"
              required
            />
          </div>

          {errors
            ?.amount?.[0] ? (
            <p className="text-sm text-destructive">
              {
                errors
                  .amount[0]
              }
            </p>
          ) : null}
        </div>
      </div>

      {debt ? (
        <div className="rounded-xl border bg-muted/20 p-5">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-background">
              <Landmark
                className="size-4"
                aria-hidden="true"
              />
            </div>

            <div>
              <div className="text-sm font-medium">
                Debt terms
              </div>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                VentureScope uses equal-principal repayment with declining interest.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="space-y-2">
              <Label
                htmlFor={`${idPrefix}-apr`}
              >
                APR
              </Label>

              <div className="relative">
                <Input
                  id={`${idPrefix}-apr`}
                  name="apr"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  defaultValue={
                    defaults.apr ||
                    "0"
                  }
                  className="pr-10"
                  required
                />

                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  %
                </span>
              </div>

              {errors
                ?.apr?.[0] ? (
                <p className="text-sm text-destructive">
                  {
                    errors
                      .apr[0]
                  }
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor={`${idPrefix}-term`}
              >
                Loan term
              </Label>

              <div className="relative">
                <Input
                  id={`${idPrefix}-term`}
                  name="termMonths"
                  type="number"
                  min="1"
                  max="600"
                  step="1"
                  defaultValue={
                    defaults.termMonths ||
                    "24"
                  }
                  className="pr-20"
                  required
                />

                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  months
                </span>
              </div>

              {errors
                ?.termMonths?.[0] ? (
                <p className="text-sm text-destructive">
                  {
                    errors
                      .termMonths[0]
                  }
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor={`${idPrefix}-repayment-start`}
              >
                Repayment starts
              </Label>

              <Input
                id={`${idPrefix}-repayment-start`}
                name="repaymentStartMonth"
                type="month"
                min={
                  earliestRepayment
                }
                value={
                  repaymentStartMonth
                }
                onChange={(
                  event,
                ) =>
                  setRepaymentStartMonth(
                    event
                      .target
                      .value,
                  )
                }
              />

              {errors
                ?.repaymentStartMonth?.[0] ? (
                <p className="text-sm text-destructive">
                  {
                    errors
                      .repaymentStartMonth[0]
                  }
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <>
          <input
            type="hidden"
            name="apr"
            value=""
          />

          <input
            type="hidden"
            name="termMonths"
            value=""
          />

          <input
            type="hidden"
            name="repaymentStartMonth"
            value=""
          />
        </>
      )}
    </div>
  );
}
