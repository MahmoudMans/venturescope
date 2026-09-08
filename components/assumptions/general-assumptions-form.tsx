"use client";

import {
  Landmark,
  Percent,
  Wallet,
} from "lucide-react";
import {
  useActionState,
} from "react";

import {
  saveGeneralAssumptionsAction,
} from "@/app/(app)/projects/assumption-actions";
import {
  AssumptionActionMessage,
} from "@/components/assumptions/assumption-action-message";
import {
  AssumptionSaveButton,
} from "@/components/assumptions/assumption-save-button";
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
  GeneralAssumptions,
} from "@/lib/finance/assumptions/types";

type GeneralAssumptionsFormProps = {
  projectId: string;
  currency: string;
  assumptions: GeneralAssumptions;
};

export function GeneralAssumptionsForm({
  projectId,
  currency,
  assumptions,
}: GeneralAssumptionsFormProps) {
  const [
    state,
    action,
  ] = useActionState(
    saveGeneralAssumptionsAction,
    initialAssumptionActionState,
  );

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
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>
                General financial assumptions
              </CardTitle>

              <CardDescription className="mt-1">
                Define the starting cash position and optional corporate tax rate.
              </CardDescription>
            </div>

            <Landmark
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <AssumptionActionMessage
            state={state}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startingCash">
                Starting cash
              </Label>

              <div className="relative">
                <Wallet
                  className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />

                <Input
                  id="startingCash"
                  name="startingCash"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={
                    assumptions.startingCash
                  }
                  className="pl-9"
                  required
                />
              </div>

              <p className="text-xs leading-5 text-muted-foreground">
                Current cash available to the business in {currency}.
              </p>

              {state.errors
                ?.startingCash?.[0] ? (
                <p className="text-sm text-destructive">
                  {
                    state.errors
                      .startingCash[0]
                  }
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="corporateTaxRate">
                Corporate tax rate
              </Label>

              <div className="relative">
                <Percent
                  className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />

                <Input
                  id="corporateTaxRate"
                  name="corporateTaxRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  defaultValue={
                    assumptions.corporateTaxRate
                  }
                  className="pl-9"
                  required
                />
              </div>

              <p className="text-xs leading-5 text-muted-foreground">
                Use 0% if tax modelling is not required.
              </p>

              {state.errors
                ?.corporateTaxRate?.[0] ? (
                <p className="text-sm text-destructive">
                  {
                    state.errors
                      .corporateTaxRate[0]
                  }
                </p>
              ) : null}
            </div>
          </div>
        </CardContent>

        <CardFooter className="justify-end border-t py-5">
          <AssumptionSaveButton
            label="Save general assumptions"
          />
        </CardFooter>
      </Card>
    </form>
  );
}
