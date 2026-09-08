"use client";

import {
  CircleDollarSign,
} from "lucide-react";
import {
  useActionState,
} from "react";

import {
  createFinancingEventAction,
} from "@/app/(app)/projects/financing-actions";
import {
  FinancingActionMessage,
} from "@/components/financing/financing-action-message";
import {
  FinancingEventFields,
} from "@/components/financing/financing-event-fields";
import {
  FinancingSubmitButton,
} from "@/components/financing/financing-submit-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  initialFinancingActionState,
} from "@/lib/financing/action-state";

type CreateFinancingEventFormProps = {
  projectId: string;

  currency: string;

  projectStartMonth: string;

  projectEndMonth: string;
};

export function CreateFinancingEventForm({
  projectId,
  currency,
  projectStartMonth,
  projectEndMonth,
}: CreateFinancingEventFormProps) {
  const [
    state,
    action,
  ] = useActionState(
    createFinancingEventAction,
    initialFinancingActionState,
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
          projectId
        }
      />

      <Card className="border-border/70">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>
                Add financing event
              </CardTitle>

              <CardDescription className="mt-1 max-w-2xl">
                Add equity, debt, grant or other external financing to the model&apos;s cash forecast.
              </CardDescription>
            </div>

            <CircleDollarSign
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <FinancingActionMessage
            state={
              state
            }
          />

          <FinancingEventFields
            idPrefix="create-financing"
            currency={
              currency
            }
            projectStartMonth={
              projectStartMonth
            }
            projectEndMonth={
              projectEndMonth
            }
            defaults={{
              name:
                "",

              type:
                "EQUITY",

              month:
                projectStartMonth,

              amount:
                "100000",

              apr:
                "0",

              termMonths:
                "24",

              repaymentStartMonth:
                "",
            }}
            errors={
              state.errors
            }
          />
        </CardContent>

        <CardFooter className="justify-end border-t py-5">
          <FinancingSubmitButton
            label="Add financing"
            pendingLabel="Adding..."
          />
        </CardFooter>
      </Card>
    </form>
  );
}
