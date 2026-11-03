"use client";

import {
  Banknote,
  RotateCcw,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import {
  useState,
} from "react";

import {
  clearFinancingEventsAction,
  clearMonthlyOverridesAction,
  resetFinancialAssumptionsAction,
  resetScenarioLibraryAction,
} from "@/app/(app)/projects/settings-actions";
import {
  SubmitButton,
} from "@/components/forms/submit-button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Button,
} from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DestructiveAction =
  | "ASSUMPTIONS"
  | "FINANCING"
  | "OVERRIDES"
  | "SCENARIOS";

type GovernanceDefinition = {
  type:
    DestructiveAction;

  title:
    string;

  description:
    string;

  confirmationTitle:
    string;

  confirmationDescription:
    string;

  buttonLabel:
    string;

  icon:
    React.ComponentType<{
      className?: string;
    }>;
};

const definitions: GovernanceDefinition[] =
  [
    {
      type:
        "ASSUMPTIONS",

      title:
        "Reset financial assumptions",

      description:
        "Restore General, Revenue and Expense assumptions to VentureScope defaults and mark all three setup sections incomplete.",

      confirmationTitle:
        "Reset all financial assumptions?",

      confirmationDescription:
        "All configured Base assumptions will be replaced by defaults. Financing events, scenarios and monthly overrides are preserved, but analysis will remain unavailable until assumptions are configured again.",

      buttonLabel:
        "Reset assumptions",

      icon:
        RotateCcw,
    },

    {
      type:
        "FINANCING",

      title:
        "Clear financing events",

      description:
        "Delete every equity, debt, grant and other financing event from this model.",

      confirmationTitle:
        "Delete all financing events?",

      confirmationDescription:
        "All funding events, loan terms, interest schedules and principal repayments will be removed from the financial model.",

      buttonLabel:
        "Clear financing",

      icon:
        Banknote,
    },

    {
      type:
        "OVERRIDES",

      title:
        "Clear monthly overrides",

      description:
        "Delete every global and scenario-specific monthly planning override.",

      confirmationTitle:
        "Delete all monthly overrides?",

      confirmationDescription:
        "All one-off Revenue, Marketing, Salaries, Rent, COGS, CAC, Churn and ARPU adjustments will be removed.",

      buttonLabel:
        "Clear overrides",

      icon:
        SlidersHorizontal,
    },

    {
      type:
        "SCENARIOS",

      title:
        "Reset scenario library",

      description:
        "Remove custom scenarios and recreate clean Base, Bull and Bear defaults.",

      confirmationTitle:
        "Reset the complete scenario library?",

      confirmationDescription:
        "All custom scenarios and all scenario-specific monthly overrides will be deleted. Global monthly overrides remain. Base, Bull and Bear will be recreated from VentureScope defaults.",

      buttonLabel:
        "Reset scenarios",

      icon:
        ShieldAlert,
    },
  ];

export function ModelGovernance({
  projectId,
  canChange = true,
}: {
  projectId: string;

  /** False for a collaborator: only the owner of a model can reset or clear its data. */
  canChange?: boolean;
}) {
  const [
    selected,
    setSelected,
  ] =
    useState<DestructiveAction | null>(
      null,
    );

  const definition =
    definitions.find(
      (
        item,
      ) =>
        item.type ===
        selected,
    );

  const action =
    selected ===
    "ASSUMPTIONS"
      ? resetFinancialAssumptionsAction
      : selected ===
          "FINANCING"
        ? clearFinancingEventsAction
        : selected ===
            "OVERRIDES"
          ? clearMonthlyOverridesAction
          : resetScenarioLibraryAction;

  if (canChange === false) {
    return null;
  }

  return (
    <>
      <Card className="border-destructive/30">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <ShieldAlert
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div>
              <CardTitle>
                Model governance
              </CardTitle>

              <CardDescription className="mt-1 max-w-3xl leading-6">
                Destructive operations require explicit confirmation. VentureScope never performs these actions automatically when normal settings change.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 xl:grid-cols-2">
          {definitions.map(
            (
              item,
            ) => {
              const Icon =
                item.icon;

              return (
                <div
                  key={
                    item.type
                  }
                  className="flex flex-col justify-between gap-5 rounded-xl border p-5"
                >
                  <div className="flex gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <Icon
                        className="size-4"
                        aria-hidden="true"
                      />
                    </div>

                    <div>
                      <div className="font-medium">
                        {
                          item.title
                        }
                      </div>

                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {
                          item.description
                        }
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-fit"
                    onClick={() =>
                      setSelected(
                        item.type,
                      )
                    }
                  >
                    <Trash2
                      className="size-4"
                      aria-hidden="true"
                    />

                    {
                      item.buttonLabel
                    }
                  </Button>
                </div>
              );
            },
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={
          selected !==
          null
        }
        onOpenChange={(
          open,
        ) => {
          if (!open) {
            setSelected(
              null,
            );
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {
                definition
                  ?.confirmationTitle
              }
            </AlertDialogTitle>

            <AlertDialogDescription>
              {
                definition
                  ?.confirmationDescription
              }
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>

            {definition ? (
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

                <SubmitButton
                  variant="destructive"
                  pendingLabel="Working..."
                >
                  <Trash2
                    className="size-4"
                    aria-hidden="true"
                  />

                  Confirm
                </SubmitButton>
              </form>
            ) : null}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
