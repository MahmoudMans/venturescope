"use client";

import {
  Pencil,
  Trash2,
} from "lucide-react";
import {
  useActionState,
  useState,
} from "react";

import {
  deleteMonthlyOverrideAction,
  updateMonthlyOverrideAction,
} from "@/app/(app)/projects/override-actions";
import {
  SubmitButton,
} from "@/components/forms/submit-button";
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
  initialMonthlyOverrideActionState,
} from "@/lib/overrides/action-state";
import type {
  MonthlyOverrideViewModel,
} from "@/lib/overrides/types";

type ScenarioOption = {
  id: string;

  name: string;
};

export function MonthlyOverrideActions({
  projectId,
  currency,
  revenueMode,
  projectStartMonth,
  projectEndMonth,
  scenarios,
  override,
}: {
  projectId: string;

  currency: string;

  revenueMode: RevenueMode;

  projectStartMonth: string;

  projectEndMonth: string;

  scenarios: ScenarioOption[];

  override: MonthlyOverrideViewModel;
}) {
  const [
    editOpen,
    setEditOpen,
  ] = useState(
    false,
  );

  const [
    deleteOpen,
    setDeleteOpen,
  ] = useState(
    false,
  );

  const [
    state,
    action,
  ] = useActionState(
    updateMonthlyOverrideAction,
    initialMonthlyOverrideActionState,
  );

  const formRef =
    useFormErrorRecovery(
      state.errors,
    );

return (
    <>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            setEditOpen(
              true,
            )
          }
        >
          <Pencil
            className="size-4"
            aria-hidden="true"
          />

          Edit
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            setDeleteOpen(
              true,
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

      <Dialog
        open={
          editOpen
        }
        onOpenChange={
          setEditOpen
        }
      >
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-4xl">
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

            <input
              type="hidden"
              name="overrideId"
              value={
                override.id
              }
            />

            <DialogHeader>
              <DialogTitle>
                Edit monthly override
              </DialogTitle>

              <DialogDescription>
                Updating this override immediately recalculates every affected financial analysis.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-7 py-6">
              <OverrideActionMessage
                state={
                  state
                }
              />

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`edit-override-month-${override.id}`}>
                    Forecast month
                  </Label>

                  <Input
                    id={`edit-override-month-${override.id}`}
                    name="month"
                    type="month"
                    min={
                      projectStartMonth
                    }
                    max={
                      projectEndMonth
                    }
                    defaultValue={
                      override.month
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`edit-override-scenario-${override.id}`}>
                    Scenario scope
                  </Label>

                  <select
                    id={`edit-override-scenario-${override.id}`}
                    name="scenarioId"
                    defaultValue={
                      override.scenarioId ??
                      ""
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
                </div>
              </div>

              <MonthlyOverrideFields
                currency={
                  currency
                }
                revenueMode={
                  revenueMode
                }
                defaults={
                  override.values
                }
                errors={
                  state.errors
                }
              />

              <div className="space-y-2">
                <Label htmlFor={`edit-override-note-${override.id}`}>
                  Planning note
                </Label>

                <Input
                  id={`edit-override-note-${override.id}`}
                  name="note"
                  maxLength={240}
                  defaultValue={
                    override.note ??
                    ""
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setEditOpen(
                    false,
                  )
                }
              >
                Cancel
              </Button>

              <OverrideSubmitButton
                label="Save override"
              />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={
          deleteOpen
        }
        onOpenChange={
          setDeleteOpen
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete this monthly override?
            </AlertDialogTitle>

            <AlertDialogDescription>
              The forecast will immediately return to its normal calculated values for fields supplied by this override.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>

            <form
              action={
                deleteMonthlyOverrideAction
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
                name="overrideId"
                value={
                  override.id
                }
              />

              <SubmitButton
                variant="destructive"
                pendingLabel="Deleting..."
              >
                <Trash2
                  className="size-4"
                  aria-hidden="true"
                />

                Delete override
              </SubmitButton>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
