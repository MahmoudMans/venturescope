"use client";

import { useState } from "react";

import { changePasswordAction } from "@/app/(app)/account/security/actions";
import { PasswordChecklist } from "@/components/auth/password-checklist";
import { PasswordInput } from "@/components/auth/password-input";
import { SubmitButton } from "@/components/forms/submit-button";
import { Label } from "@/components/ui/label";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/auth/password-policy";
import { getAccountPasswordChecks } from "@/lib/auth/policy-checks";
import { cn } from "@/lib/utils";

export function ChangePasswordForm() {
  // Controlled so the checklist can react while typing.
  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === newPassword;

  return (
    <form action={changePasswordAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current password</Label>

        <PasswordInput
          id="currentPassword"
          name="currentPassword"
          autoComplete="current-password"
          toggleLabel="Show current password"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">New password</Label>

        <PasswordInput
          id="newPassword"
          name="newPassword"
          autoComplete="new-password"
          toggleLabel="Show new password"
          describedBy="new-password-requirements"
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={PASSWORD_MAX_LENGTH}
          value={newPassword}
          onValueChange={setNewPassword}
        />

        <PasswordChecklist
          id="new-password-requirements"
          checks={getAccountPasswordChecks(newPassword)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>

        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          toggleLabel="Show confirmed password"
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={PASSWORD_MAX_LENGTH}
          value={confirmPassword}
          onValueChange={setConfirmPassword}
        />

        <p
          aria-live="polite"
          className={cn(
            "min-h-4 text-xs",
            passwordsMatch ? "text-success" : "text-muted-foreground",
          )}
        >
          {confirmPassword.length === 0
            ? ""
            : passwordsMatch
              ? "Passwords match"
              : "Passwords don’t match yet"}
        </p>
      </div>

      <p className="text-xs leading-5 text-muted-foreground">
        Changing your password signs you out everywhere, including this browser.
      </p>

      <SubmitButton size="lg" pendingLabel="Changing password...">
        Change password
      </SubmitButton>
    </form>
  );
}
