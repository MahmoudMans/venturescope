"use client";

import {
  LoaderCircle,
  Save,
} from "lucide-react";
import {
  useFormStatus,
} from "react-dom";

import {
  Button,
} from "@/components/ui/button";

type FinancingSubmitButtonProps = {
  label: string;

  pendingLabel?: string;
};

export function FinancingSubmitButton({
  label,
  pendingLabel = "Saving...",
}: FinancingSubmitButtonProps) {
  const {
    pending,
  } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={
        pending
      }
    >
      {pending ? (
        <>
          <LoaderCircle
            className="size-4 animate-spin"
            aria-hidden="true"
          />

          {
            pendingLabel
          }
        </>
      ) : (
        <>
          <Save
            className="size-4"
            aria-hidden="true"
          />

          {
            label
          }
        </>
      )}
    </Button>
  );
}
