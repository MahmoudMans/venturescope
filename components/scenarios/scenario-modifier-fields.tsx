"use client";

import {
  Input,
} from "@/components/ui/input";
import {
  Label,
} from "@/components/ui/label";
import type {
  RevenueMode,
} from "@/lib/finance/types";
import type {
  ScenarioModifierFormValues,
} from "@/lib/scenarios/types";

type ScenarioModifierFieldsProps = {
  revenueMode: RevenueMode;

  defaults: ScenarioModifierFormValues;

  errors?: Record<
    string,
    string[] | undefined
  >;
};

export function ScenarioModifierFields({
  revenueMode,
  defaults,
  errors,
}: ScenarioModifierFieldsProps) {
  const customerDriven =
    revenueMode ===
    "CUSTOMER_DRIVEN";

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <ModifierField
          id="growthAdjustmentPercentage"
          name="growthAdjustmentPercentage"
          label={
            customerDriven
              ? "Customer acquisition growth adjustment"
              : "Revenue growth adjustment"
          }
          defaultValue={
            defaults.growthAdjustmentPercentage
          }
          suffix="%"
          min="-100"
          max="500"
          help="Relative adjustment to the model's existing growth assumption."
          error={
            errors
              ?.growthAdjustmentPercentage?.[0]
          }
        />

        <ModifierField
          id="cogsDeltaPercentagePoints"
          name="cogsDeltaPercentagePoints"
          label="COGS adjustment"
          defaultValue={
            defaults.cogsDeltaPercentagePoints
          }
          suffix="pp"
          min="-100"
          max="100"
          help="Percentage-point change to percentage-based COGS."
          error={
            errors
              ?.cogsDeltaPercentagePoints?.[0]
          }
        />
      </div>

      {customerDriven ? (
        <div className="grid gap-5 md:grid-cols-3">
          <ModifierField
            id="arpuAdjustmentPercentage"
            name="arpuAdjustmentPercentage"
            label="ARPU adjustment"
            defaultValue={
              defaults.arpuAdjustmentPercentage
            }
            suffix="%"
            min="-100"
            max="500"
            help="Relative adjustment to starting ARPU."
            error={
              errors
                ?.arpuAdjustmentPercentage?.[0]
            }
          />

          <ModifierField
            id="cacAdjustmentPercentage"
            name="cacAdjustmentPercentage"
            label="CAC adjustment"
            defaultValue={
              defaults.cacAdjustmentPercentage
            }
            suffix="%"
            min="-99"
            max="500"
            help="Relative adjustment to customer acquisition cost."
            error={
              errors
                ?.cacAdjustmentPercentage?.[0]
            }
          />

          <ModifierField
            id="churnDeltaPercentagePoints"
            name="churnDeltaPercentagePoints"
            label="Churn adjustment"
            defaultValue={
              defaults.churnDeltaPercentagePoints
            }
            suffix="pp"
            min="-100"
            max="100"
            help="Percentage-point change to monthly churn."
            error={
              errors
                ?.churnDeltaPercentagePoints?.[0]
            }
          />
        </div>
      ) : (
        <>
          <input
            type="hidden"
            name="arpuAdjustmentPercentage"
            value={
              defaults.arpuAdjustmentPercentage
            }
          />

          <input
            type="hidden"
            name="cacAdjustmentPercentage"
            value={
              defaults.cacAdjustmentPercentage
            }
          />

          <input
            type="hidden"
            name="churnDeltaPercentagePoints"
            value={
              defaults.churnDeltaPercentagePoints
            }
          />
        </>
      )}
    </div>
  );
}

function ModifierField({
  id,
  name,
  label,
  defaultValue,
  suffix,
  min,
  max,
  help,
  error,
}: {
  id: string;

  name: string;

  label: string;

  defaultValue: string;

  suffix: string;

  min: string;

  max: string;

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
        <Input
          id={id}
          name={name}
          type="number"
          step="0.01"
          min={min}
          max={max}
          defaultValue={
            defaultValue
          }
          className="pr-12"
          required
        />

        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {
            suffix
          }
        </span>
      </div>

      <p className="text-xs leading-5 text-muted-foreground">
        {
          help
        }
      </p>

      {error ? (
        <p className="text-sm text-destructive">
          {
            error
          }
        </p>
      ) : null}
    </div>
  );
}
