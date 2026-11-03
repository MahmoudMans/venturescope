import { fieldErrorId } from "@/lib/forms/field-errors";
import { cn } from "@/lib/utils";

/**
 * The message under a field. It has the id that the field points to with `aria-describedby`, so a
 * screen reader reads it together with the field. Use `fieldErrorProps` on the field.
 */
export function FieldError({
  fieldId,
  message,
  className,
}: {
  fieldId: string;
  message?: string | null;
  className?: string;
}) {
  if (message === undefined || message === null || message === "") {
    return null;
  }

  return (
    <p id={fieldErrorId(fieldId)} className={cn("text-sm text-destructive", className)}>
      {message}
    </p>
  );
}
