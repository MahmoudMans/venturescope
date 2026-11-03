import { CircleDot } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Says that the form has changes that are not saved. Put it in the footer of the form, before the
 * save button. The box is always there and empty when the form is clean, so a screen reader says
 * the note when it appears. On a phone the note takes a line of its own, so it is not cut in lines.
 */
export function UnsavedChangesNotice({ dirty }: { dirty: boolean }) {
  return (
    <div
      role="status"
      className={cn("mr-auto text-sm font-medium text-warning", dirty && "max-sm:w-full")}
    >
      {dirty ? (
        <span className="flex items-center gap-2">
          <CircleDot className="size-4 shrink-0" aria-hidden="true" />
          You have unsaved changes.
        </span>
      ) : null}
    </div>
  );
}
