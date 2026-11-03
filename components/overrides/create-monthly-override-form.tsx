"use client";

import {
  CalendarRange,
} from "lucide-react";
import {
  useActionState,
} from "react";

import {
  createMonthlyOverrideAction,
} from "@/app/(app)/projects/override-actions";
import { FieldError } from "@/components/forms/field-error";
import { useFormErrorRecovery } from "@/components/forms/use-form-error-recovery";
import {
  MonthlyOverrideFields,
} from "@/components/overrides/monthly-override-fields";
import {
  OverrideActionMessage,
} from "@/components/overrides/override-action-message";
import {
  OverrideSubmitButton,
} from "@/components/overrides/override-submit-button";
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
import { fieldErrorProps } from "@/lib/forms/field-errors";
import {
  initialMonthlyOverrideActionState,
} from "@/lib/overrides/action-state";
import type {
  RevenueMode,
} from "@/lib/finance/types";

type ScenarioOption = {
  id: string;

  name: string;
};

export function CreateMonthlyOverrideForm({
  projectId,
  currency,
  revenueMode,
  projectStartMonth,
  projectEndMonth,
  scenarios,
  defaultScenarioId,
}: {
  projectId: string;

  currency: string;

  revenueMode: RevenueMode;

  projectStartMonth: string;

  projectEndMonth: string;

  scenarios: ScenarioOption[];

  defaultScenarioId: string;
}) {
  const [
    state,
    action,
  ] = useActionState(
    createMonthlyOverrideAction,
    initialMonthlyOverrideActionState,
  );

  const formRef =
    useFormErrorRecovery(
      state.errors,
    );

  return (
    <form
      ref={formRef}
      action={
        action
      }
    >
      <input
        type="hidden"
        name="projectId"
        value={
          projectId
        }
      />

      <Card className="border-border/70">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>
                Add monthly override
              </CardTitle>

              <CardDescription className="mt-1 max-w-3xl">
                Replace one or more forecast values for a specific month. Overrides may apply to every scenario or only one selected scenario.
              </CardDescription>
            </div>

            <CalendarRange
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-7">
          <OverrideActionMessage
            state={
              state
            }
          />

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="override-month">
                Forecast month
              </Label>

              <Input
                id="override-month"
                name="month"
                {...fieldErrorProps("override-month", state.errors?.month?.[0])}
                type="month"
                min={
                  projectStartMonth
                }
                max={
                  projectEndMonth
                }
                defaultValue={
                  projectStartMonth
                }
                required
              />

              <FieldError fieldId="override-month" message={state.errors?.month?.[0]} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="override-scenario">
                Scenario scope
              </Label>

              <select
                id="override-scenario"
                name="scenarioId"
                {...fieldErrorProps("override-scenario", state.errors?.scenarioId?.[0])}
                defaultValue={
                  defaultScenarioId
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="">
                  All scenarios
                </option>

                {scenarios.map(
                  (
                    scenario,
                  ) => (
                    <option
                      key={
                        scenario.id
                      }
                      value={
                        scenario.id
                      }
                    >
                      {
                        scenario.name
                      }
                    </option>
                  ),
                )}
              </select>

              <p className="text-xs text-muted-foreground">
                Scenario-specific values take precedence over an All Scenarios override.
              </p>

              <FieldError fieldId="override-scenario" message={state.errors?.scenarioId?.[0]} />
            </div>
          </div>

          <MonthlyOverrideFields
            currency={
              currency
            }
            revenueMode={
              revenueMode
            }
            defaults={{}}
            errors={
              state.errors
            }
          />

          <div className="space-y-2">
            <Label htmlFor="override-note">
              Planning note
            </Label>

            <Input
              id="override-note"
              name="note"
              {...fieldErrorProps("override-note", state.errors?.note?.[0])}
              maxLength={240}
              placeholder="Product launch, annual conference, temporary hiring spike..."
            />

            <FieldError fieldId="override-note" message={state.errors?.note?.[0]} />
          </div>
        </CardContent>

        <CardFooter className="justify-end border-t py-5">
          <OverrideSubmitButton
            label="Add monthly override"
          />
        </CardFooter>
      </Card>
    </form>
  );
}
