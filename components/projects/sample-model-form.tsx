import { Sparkles } from "lucide-react";

import { createSampleModelAction } from "@/app/(app)/projects/sample-action";
import { SubmitButton } from "@/components/forms/submit-button";

/**
 * One button that opens a ready-made example model. It is a plain form, so
 * it also works before the page has finished loading.
 */
export function SampleModelForm({
  size = "lg",
  className,
}: {
  size?: "default" | "lg";
  className?: string;
}) {
  return (
    <form action={createSampleModelAction} className={className}>
      <SubmitButton variant="outline" size={size} pendingLabel="Creating sample...">
        <Sparkles className="size-4" aria-hidden="true" />
        Try a sample model
      </SubmitButton>
    </form>
  );
}
