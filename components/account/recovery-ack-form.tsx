"use client";

import { Check } from "lucide-react";
import { useActionState } from "react";

import { acknowledgeRecoveryKeyAction } from "@/app/(app)/account/security/reminder-actions";
import { StatusNotice } from "@/components/app/status-notice";
import { SubmitButton } from "@/components/forms/submit-button";
import { initialRecoveryAckState } from "@/lib/auth/recovery-state";

/** The button "I saved my recovery key". It works without a password and changes no account data. */
export function RecoveryAckForm({
  label,
  variant = "outline",
}: {
  label: string;

  variant?: "outline" | "ghost";
}) {
  const [state, formAction] = useActionState(acknowledgeRecoveryKeyAction, initialRecoveryAckState);

  if (state.saved === true) {
    return (
      <p role="status" className="flex items-center gap-2 text-sm text-success">
        <Check className="size-4" aria-hidden="true" />
        Saved. VentureScope will not remind you on this device until your password changes.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      {state.message ? <StatusNotice tone="error">{state.message}</StatusNotice> : null}

      <SubmitButton variant={variant} pendingLabel="Saving...">
        {label}
      </SubmitButton>
    </form>
  );
}
