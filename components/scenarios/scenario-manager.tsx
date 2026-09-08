"use client";

import {
  Gauge,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import {
  useActionState,
  useState,
} from "react";

import {
  createScenarioAction,
  deleteScenarioAction,
  resetScenarioAction,
  updateScenarioAction,
} from "@/app/(app)/projects/scenario-actions";
import {
  ScenarioActionMessage,
} from "@/components/scenarios/scenario-action-message";
import {
  ScenarioModifierFields,
} from "@/components/scenarios/scenario-modifier-fields";
import {
  ScenarioSubmitButton,
} from "@/components/scenarios/scenario-submit-button";
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
  Badge,
} from "@/components/ui/badge";
import {
  Button,
} from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Input,
} from "@/components/ui/input";
import {
  Label,
} from "@/components/ui/label";
import type {
  RevenueMode,
} from "@/lib/finance/types";
import {
  initialScenarioActionState,
} from "@/lib/scenarios/action-state";
import {
  neutralScenarioModifierFormValues,
} from "@/lib/scenarios/modifiers";
import type {
  ScenarioViewModel,
} from "@/lib/scenarios/types";

const MAX_SCENARIOS =
  10;

type ScenarioManagerProps = {
  projectId: string;

  revenueMode: RevenueMode;

  scenarios: ScenarioViewModel[];
};

export function ScenarioManager({
  projectId,
  revenueMode,
  scenarios,
}: ScenarioManagerProps) {
  const [
    createOpen,
    setCreateOpen,
  ] = useState(
    false,
  );

  const [
    editing,
    setEditing,
  ] =
    useState<ScenarioViewModel | null>(
      null,
    );

  const [
    deleting,
    setDeleting,
  ] =
    useState<ScenarioViewModel | null>(
      null,
    );

  const [
    createState,
    createAction,
  ] = useActionState(
    createScenarioAction,
    initialScenarioActionState,
  );

  const [
    editState,
    editAction,
  ] = useActionState(
    updateScenarioAction,
    initialScenarioActionState,
  );

  const neutral =
    neutralScenarioModifierFormValues();

  return (
    <>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">
            Scenario library
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            {scenarios.length}/{MAX_SCENARIOS} scenarios configured.
          </p>
        </div>

        <Button
          type="button"
          onClick={() =>
            setCreateOpen(
              true,
            )
          }
          disabled={
            scenarios.length >=
            MAX_SCENARIOS
          }
        >
          <Plus
            className="size-4"
            aria-hidden="true"
          />

          Add scenario
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {scenarios.map(
          (
            scenario,
          ) => (
            <Card
              key={
                scenario.id
              }
              className="border-border/70"
            >
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div className="flex min-w-0 gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <Gauge
                      className="size-4"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="truncate font-semibold">
                      {
                        scenario.name
                      }
                    </div>

                    <Badge
                      variant={
                        scenario.type ===
                        "BASE"
                          ? "default"
                          : "outline"
                      }
                      className="mt-2"
                    >
                      {
                        scenario.type
                      }
                    </Badge>
                  </div>
                </div>

                {scenario.type !==
                "BASE" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setEditing(
                        scenario,
                      )
                    }
                    aria-label={`Edit ${scenario.name}`}
                  >
                    <Pencil
                      className="size-4"
                      aria-hidden="true"
                    />
                  </Button>
                ) : null}
              </CardHeader>

              <CardContent>
                {scenario.type ===
                "BASE" ? (
                  <p className="text-sm leading-6 text-muted-foreground">
                    Uses the project&apos;s exact persisted assumptions with no scenario adjustments.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <ModifierSummary
                      label={
                        revenueMode ===
                        "DIRECT"
                          ? "Growth"
                          : "Acquisition"
                      }
                      value={`${signed(
                        scenario.modifiers
                          .growthAdjustmentPercentage,
                      )}%`}
                    />

                    <ModifierSummary
                      label="COGS"
                      value={`${signed(
                        scenario.modifiers
                          .cogsDeltaPercentagePoints,
                      )} pp`}
                    />

                    {revenueMode ===
                    "CUSTOMER_DRIVEN" ? (
                      <>
                        <ModifierSummary
                          label="ARPU"
                          value={`${signed(
                            scenario.modifiers
                              .arpuAdjustmentPercentage,
                          )}%`}
                        />

                        <ModifierSummary
                          label="CAC"
                          value={`${signed(
                            scenario.modifiers
                              .cacAdjustmentPercentage,
                          )}%`}
                        />

                        <ModifierSummary
                          label="Churn"
                          value={`${signed(
                            scenario.modifiers
                              .churnDeltaPercentagePoints,
                          )} pp`}
                        />
                      </>
                    ) : null}
                  </div>
                )}

                {scenario.type ===
                "BULL" ||
                scenario.type ===
                "BEAR" ? (
                  <form
                    action={
                      resetScenarioAction
                    }
                    className="mt-5 border-t pt-4"
                  >
                    <input
                      type="hidden"
                      name="projectId"
                      value={
                        projectId
                      }
                    />

                    <input
                      type="hidden"
                      name="scenarioId"
                      value={
                        scenario.id
                      }
                    />

                    <Button
                      type="submit"
                      size="sm"
                      variant="ghost"
                    >
                      <RotateCcw
                        className="size-4"
                        aria-hidden="true"
                      />

                      Reset defaults
                    </Button>
                  </form>
                ) : null}

                {scenario.type ===
                "CUSTOM" ? (
                  <div className="mt-5 border-t pt-4">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setDeleting(
                          scenario,
                        )
                      }
                    >
                      <Trash2
                        className="size-4"
                        aria-hidden="true"
                      />

                      Delete
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ),
        )}
      </div>

      <Dialog
        open={
          createOpen
        }
        onOpenChange={
          setCreateOpen
        }
      >
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
          <form
            action={
              createAction
            }
          >
            <input
              type="hidden"
              name="projectId"
              value={
                projectId
              }
            />

            <DialogHeader>
              <DialogTitle>
                Create custom scenario
              </DialogTitle>

              <DialogDescription>
                Define a reusable scenario relative to the project&apos;s Base Case assumptions.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-6">
              <ScenarioActionMessage
                state={
                  createState
                }
              />

              <div className="space-y-2">
                <Label htmlFor="new-scenario-name">
                  Scenario name
                </Label>

                <Input
                  id="new-scenario-name"
                  name="name"
                  placeholder="Marketing Expansion"
                  required
                />

                {createState
                  .errors
                  ?.name?.[0] ? (
                  <p className="text-sm text-destructive">
                    {
                      createState.errors
                        .name[0]
                    }
                  </p>
                ) : null}
              </div>

              <ScenarioModifierFields
                revenueMode={
                  revenueMode
                }
                defaults={
                  neutral
                }
                errors={
                  createState.errors
                }
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setCreateOpen(
                    false,
                  )
                }
              >
                Close
              </Button>

              <ScenarioSubmitButton
                label="Create scenario"
              />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={
          editing !==
          null
        }
        onOpenChange={(
          open,
        ) => {
          if (!open) {
            setEditing(
              null,
            );
          }
        }}
      >
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
          {editing ? (
            <form
              action={
                editAction
              }
            >
              <input
                type="hidden"
                name="projectId"
                value={
                  projectId
                }
              />

              <input
                type="hidden"
                name="scenarioId"
                value={
                  editing.id
                }
              />

              <DialogHeader>
                <DialogTitle>
                  Edit {editing.name}
                </DialogTitle>

                <DialogDescription>
                  Update the modifiers applied by this scenario to the Base Case assumptions.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-6">
                <ScenarioActionMessage
                  state={
                    editState
                  }
                />

                <div className="space-y-2">
                  <Label htmlFor="edit-scenario-name">
                    Scenario name
                  </Label>

                  {editing.type ===
                  "CUSTOM" ? (
                    <Input
                      id="edit-scenario-name"
                      name="name"
                      defaultValue={
                        editing.name
                      }
                      required
                    />
                  ) : (
                    <>
                      <Input
                        id="edit-scenario-name"
                        value={
                          editing.name
                        }
                        disabled
                      />

                      <input
                        type="hidden"
                        name="name"
                        value={
                          editing.name
                        }
                      />
                    </>
                  )}

                  {editState
                    .errors
                    ?.name?.[0] ? (
                    <p className="text-sm text-destructive">
                      {
                        editState.errors
                          .name[0]
                      }
                    </p>
                  ) : null}
                </div>

                <ScenarioModifierFields
                  revenueMode={
                    revenueMode
                  }
                  defaults={
                    editing.modifiers
                  }
                  errors={
                    editState.errors
                  }
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setEditing(
                      null,
                    )
                  }
                >
                  Close
                </Button>

                <ScenarioSubmitButton
                  label="Save scenario"
                />
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={
          deleting !==
          null
        }
        onOpenChange={(
          open,
        ) => {
          if (!open) {
            setDeleting(
              null,
            );
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete &ldquo;{deleting?.name}&rdquo;?
            </AlertDialogTitle>

            <AlertDialogDescription>
              The custom scenario will be permanently removed. Base, Bull and Bear scenarios cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>

            {deleting ? (
              <form
                action={
                  deleteScenarioAction
                }
              >
                <input
                  type="hidden"
                  name="projectId"
                  value={
                    projectId
                  }
                />

                <input
                  type="hidden"
                  name="scenarioId"
                  value={
                    deleting.id
                  }
                />

                <Button
                  type="submit"
                  variant="destructive"
                >
                  <Trash2
                    className="size-4"
                    aria-hidden="true"
                  />

                  Delete scenario
                </Button>
              </form>
            ) : null}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ModifierSummary({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="text-muted-foreground">
        {
          label
        }
      </div>

      <div className="mt-1 font-semibold text-foreground">
        {
          value
        }
      </div>
    </div>
  );
}

function signed(
  value: string,
): string {
  const number =
    Number(
      value,
    );

  if (
    !Number.isFinite(
      number,
    )
  ) {
    return value;
  }

  if (
    number >
    0
  ) {
    return `+${value}`;
  }

  return value;
}
