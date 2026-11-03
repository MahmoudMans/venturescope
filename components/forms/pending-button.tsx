"use client";

import { LoaderCircle } from "lucide-react";
import * as React from "react";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";

type PendingButtonProps = Omit<React.ComponentProps<"button">, "type">;

/**
 * A plain submit button for a form that has an action. It keeps the look of the button you give
 * it. While the action runs it shows a small spinner and cannot be pressed a second time, so a
 * slow save, import or approval is never sent twice.
 */
export function PendingButton({ children, className, disabled, ...props }: PendingButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      {...props}
      type="submit"
      disabled={disabled === true || pending}
      aria-busy={pending || undefined}
      className={cn("touch-target aria-busy:cursor-progress aria-busy:opacity-60", className)}
    >
      {pending ? (
        <LoaderCircle
          className="mr-2 inline-block size-3.5 animate-spin align-middle motion-reduce:animate-none"
          aria-hidden="true"
        />
      ) : null}

      {children}
    </button>
  );
}
