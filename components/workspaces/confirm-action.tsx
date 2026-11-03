"use client";

import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type ConfirmActionProps = {
  /** A server action that receives the hidden fields below. */
  action: (formData: FormData) => void | Promise<void>;

  /** Sent as hidden inputs, for example { workspaceId: "..." }. */
  fields: Record<string, string>;

  title: string;

  description: string;

  confirmLabel: string;

  /** Content of the button that opens the dialog (text and an optional icon). */
  children: React.ReactNode;

  triggerVariant?: "outline" | "ghost" | "destructive";

  triggerSize?: "default" | "sm" | "lg";

  triggerClassName?: string;

  /** Style of the confirm button. Use "default" for an action that does not delete anything. */
  confirmVariant?: "default" | "destructive";
};

/**
 * Asks "are you sure?" before a destructive form action runs. Nothing is sent
 * until the person presses the confirm button inside the dialog.
 */
export function ConfirmAction({
  action,
  fields,
  title,
  description,
  confirmLabel,
  children,
  triggerVariant = "outline",
  triggerSize = "sm",
  triggerClassName,
  confirmVariant = "destructive",
}: ConfirmActionProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant={triggerVariant}
          size={triggerSize}
          className={triggerClassName}
        >
          {children}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <form action={action}>
          {Object.entries(fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}

          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>

            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>

            <AlertDialogAction asChild>
              <Button type="submit" variant={confirmVariant}>
                {confirmLabel}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
