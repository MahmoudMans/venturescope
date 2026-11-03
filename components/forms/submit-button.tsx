"use client";

import { LoaderCircle } from "lucide-react";
import * as React from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

type SubmitButtonProps = Omit<React.ComponentProps<typeof Button>, "type" | "asChild"> & {
  /** Shown while the surrounding form is being submitted. */
  pendingLabel?: string;
};

/**
 * Submit button for any <form action={...}>. It shows a spinner while the
 * action runs and cannot be pressed twice.
 */
export function SubmitButton({ children, pendingLabel, disabled, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={disabled === true || pending} {...props}>
      {pending ? (
        <>
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />

          {pendingLabel ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
