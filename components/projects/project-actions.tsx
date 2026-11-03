"use client";

import {
  CircleAlert,
  Copy,
  Download,
  LoaderCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  useActionState,
  useState,
  useTransition,
} from "react";
import {
  useFormStatus,
} from "react-dom";

import {
  deleteProjectAction,
  duplicateProjectAction,
  renameProjectAction,
} from "@/app/(app)/projects/actions";
import { FieldError } from "@/components/forms/field-error";
import { useFormErrorRecovery } from "@/components/forms/use-form-error-recovery";
import {
  AlertDialog,
  AlertDialogAction,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Input,
} from "@/components/ui/input";
import {
  Label,
} from "@/components/ui/label";
import { fieldErrorProps } from "@/lib/forms/field-errors";
import {
  initialRenameProjectState,
} from "@/lib/projects/action-state";

type ProjectActionsProps = {
  projectId: string;
  projectName: string;
  returnTo: string;

  /** Shown in the delete dialog when other people can open the model. */
  deleteWarning?: string | null;
};

export function ProjectActions({
  projectId,
  projectName,
  returnTo,
  deleteWarning = null,
}: ProjectActionsProps) {
  const [
    renameOpen,
    setRenameOpen,
  ] = useState(false);

  const [
    deleteOpen,
    setDeleteOpen,
  ] = useState(false);

  const [
    duplicatePending,
    startDuplicateTransition,
  ] = useTransition();

  const [
    renameState,
    renameFormAction,
  ] = useActionState(
    renameProjectAction,
    initialRenameProjectState,
  );

  const renameFormRef =
    useFormErrorRecovery(
      renameState.errors,
    );

  function duplicateProject() {
    startDuplicateTransition(
      async () => {
        await duplicateProjectAction(
          projectId,
        );
      },
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          asChild
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Actions for ${projectName}`}
          >
            {duplicatePending ? (
              <LoaderCircle
                className="size-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <MoreHorizontal
                className="size-4"
                aria-hidden="true"
              />
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-48"
        >
          <DropdownMenuItem
            onSelect={(
              event,
            ) => {
              event.preventDefault();

              setRenameOpen(
                true,
              );
            }}
          >
            <Pencil
              className="size-4"
              aria-hidden="true"
            />

            Rename
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={
              duplicatePending
            }
            onSelect={(
              event,
            ) => {
              event.preventDefault();

              duplicateProject();
            }}
          >
            <Copy
              className="size-4"
              aria-hidden="true"
            />

            Duplicate
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <a href={`/api/projects/${projectId}/export/json`} download>
              <Download className="size-4" aria-hidden="true" />

              Download backup
            </a>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            onSelect={(
              event,
            ) => {
              event.preventDefault();

              setDeleteOpen(
                true,
              );
            }}
          >
            <Trash2
              className="size-4"
              aria-hidden="true"
            />

            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={
          renameOpen
        }
        onOpenChange={
          setRenameOpen
        }
      >
        <DialogContent>
          <form
            ref={renameFormRef}
            action={
              renameFormAction
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
              name="returnTo"
              value={
                returnTo
              }
            />

            <DialogHeader>
              <DialogTitle>
                Rename financial model
              </DialogTitle>

              <DialogDescription>
                Change the model name. Financial configuration and scenarios remain unchanged.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-6">
              {renameState.message ? (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                >
                  {
                    renameState.message
                  }
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor={`rename-${projectId}`}>
                  Model name
                </Label>

                <Input
                  id={`rename-${projectId}`}
                  name="name"
                  {...fieldErrorProps(`rename-${projectId}`, renameState.errors?.name?.[0])}
                  defaultValue={
                    projectName
                  }
                  autoFocus
                />

                <FieldError
                  fieldId={`rename-${projectId}`}
                  message={renameState.errors?.name?.[0]}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setRenameOpen(
                    false,
                  )
                }
              >
                Cancel
              </Button>

              <RenameSubmitButton />
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
          <form
            action={
              deleteProjectAction
            }
          >
            <input
              type="hidden"
              name="projectId"
              value={
                projectId
              }
            />

            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete &ldquo;{projectName}&rdquo;?
              </AlertDialogTitle>

              <AlertDialogDescription>
                This permanently deletes the model and everything inside it: scenarios, financing events, monthly overrides, actuals, versions, reviews, approvals and imports. It cannot be undone. Download a backup first if you might need it again.
              </AlertDialogDescription>

              {deleteWarning ? (
                <div
                  role="note"
                  className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning"
                >
                  <CircleAlert
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />

                  <span>
                    {deleteWarning}
                  </span>
                </div>
              ) : null}
            </AlertDialogHeader>

            <AlertDialogFooter className="mt-6">
              <AlertDialogCancel
                type="button"
              >
                Cancel
              </AlertDialogCancel>

              <AlertDialogAction
                asChild
              >
                <Button
                  type="submit"
                  variant="destructive"
                >
                  <Trash2
                    className="size-4"
                    aria-hidden="true"
                  />

                  Delete model
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function RenameSubmitButton() {
  const {
    pending,
  } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
    >
      {pending ? (
        <>
          <LoaderCircle
            className="size-4 animate-spin"
            aria-hidden="true"
          />

          Saving...
        </>
      ) : (
        "Save name"
      )}
    </Button>
  );
}
