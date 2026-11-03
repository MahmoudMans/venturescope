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
  deleteFinancingEventAction,
  updateFinancingEventAction,
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
  SubmitButton,
} from "@/components/forms/submit-button";
import { useFormErrorRecovery } from "@/components/forms/use-form-error-recovery";
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
  initialFinancingActionState,
} from "@/lib/financing/action-state";
import type {
  FinancingEventViewModel,
} from "@/lib/financing/types";

type FinancingEventActionsProps = {
  projectId: string;

  currency: string;

  projectStartMonth: string;

  projectEndMonth: string;

  event: FinancingEventViewModel;
};

export function FinancingEventActions({
  projectId,
  currency,
  projectStartMonth,
  projectEndMonth,
  event,
}: FinancingEventActionsProps) {
  const [
    editOpen,
    setEditOpen,
  ] =
    useState(
      false,
    );

  const [
    deleteOpen,
    setDeleteOpen,
  ] =
    useState(
      false,
    );

  const [
    state,
    action,
  ] = useActionState(
    updateFinancingEventAction,
    initialFinancingActionState,
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
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
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
              name="eventId"
              value={
                event.id
              }
            />

            <DialogHeader>
              <DialogTitle>
                Edit financing event
              </DialogTitle>

              <DialogDescription>
                Changes immediately flow through VentureScope&apos;s forecast, P&amp;L and cash-flow engine.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-6">
              <FinancingActionMessage
                state={
                  state
                }
              />

              <FinancingEventFields
                idPrefix={`edit-${event.id}`}
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
                    event.name,

                  type:
                    event.type,

                  month:
                    event.month,

                  amount:
                    event.amount,

                  apr:
                    event.apr ??
                    "0",

                  termMonths:
                    event.termMonths
                      ? String(
                          event.termMonths,
                        )
                      : "24",

                  repaymentStartMonth:
                    event.repaymentStartMonth ??
                    "",
                }}
                errors={
                  state.errors
                }
              />
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

              <FinancingSubmitButton
                label="Save financing"
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
              Delete &ldquo;{event.name}&rdquo;?
            </AlertDialogTitle>

            <AlertDialogDescription>
              This permanently removes the financing event from the model. Forecast cash flow, interest and debt repayments will be recalculated without it.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>

            <form
              action={
                deleteFinancingEventAction
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
                name="eventId"
                value={
                  event.id
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

                Delete financing
              </SubmitButton>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
