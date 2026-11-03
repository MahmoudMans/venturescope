"use client";

import { Check, Copy } from "lucide-react";
import { useActionState, useState } from "react";

import { revealRecoveryKeyAction } from "@/app/(app)/account/security/recovery-actions";
import { RecoveryAckForm } from "@/components/account/recovery-ack-form";
import { StatusNotice } from "@/components/app/status-notice";
import { PasswordInput } from "@/components/auth/password-input";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { initialRecoveryKeyRevealState } from "@/lib/auth/recovery-state";

export function RecoveryKeyForm() {
  const [state, formAction] = useActionState(
    revealRecoveryKeyAction,
    initialRecoveryKeyRevealState,
  );

  const [copied, setCopied] = useState(false);

  async function copyKey(value: string) {
    try {
      await navigator.clipboard.writeText(value);

      setCopied(true);

      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-4">
        {state.message ? <StatusNotice tone="error">{state.message}</StatusNotice> : null}

        <div className="space-y-2">
          <Label htmlFor="recoveryPassword">Your password</Label>

          <PasswordInput
            id="recoveryPassword"
            name="password"
            autoComplete="current-password"
            toggleLabel="Show password"
          />
        </div>

        <SubmitButton variant="outline" size="lg" pendingLabel="Checking...">
          Show recovery key
        </SubmitButton>
      </form>

      {state.recoveryKey ? (
        <div className="space-y-3 rounded-xl border bg-muted/40 p-4">
          <div className="text-xs font-medium text-muted-foreground">Your recovery key</div>

          <div className="flex flex-wrap items-center gap-3">
            <code
              data-testid="recovery-key"
              className="select-all rounded-lg bg-background px-3 py-2 font-mono text-base tracking-wider ring-1 ring-border"
            >
              {state.recoveryKey}
            </code>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => copyKey(state.recoveryKey ?? "")}
            >
              {copied ? (
                <Check className="size-4" aria-hidden="true" />
              ) : (
                <Copy className="size-4" aria-hidden="true" />
              )}

              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          <p className="text-xs leading-5 text-muted-foreground">
            Save it in a password manager or write it down. Anyone who has this key and your email
            can set a new password, so do not share it. The key changes whenever your password
            changes.
          </p>

          <RecoveryAckForm label="I saved my key" />
        </div>
      ) : null}
    </div>
  );
}
