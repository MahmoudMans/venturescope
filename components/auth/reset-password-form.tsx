"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { resetPasswordAction } from "@/app/(auth)/forgot-password/actions";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { PasswordChecklist } from "@/components/auth/password-checklist";
import { PasswordInput } from "@/components/auth/password-input";
import { useFormErrorRecovery } from "@/components/forms/use-form-error-recovery";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/auth/password-policy";
import { getAccountPasswordChecks } from "@/lib/auth/policy-checks";
import { initialRecoveryResetState } from "@/lib/auth/recovery-state";
import { authPageHref, describeResetIntro } from "@/lib/auth/return-path";
import { cn } from "@/lib/utils";

export function ResetPasswordForm({ returnTo = null }: { returnTo?: string | null }) {
  const [state, formAction] = useActionState(resetPasswordAction, initialRecoveryResetState);

  const formRef = useFormErrorRecovery(state.errors);

  // Controlled so typed values survive the form reset that follows a failed attempt.
  const [email, setEmail] = useState("");

  const [recoveryKey, setRecoveryKey] = useState("");

  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const emailError = state.errors?.email?.[0];

  const keyError = state.errors?.recoveryKey?.[0];

  const passwordError = state.errors?.newPassword?.[0];

  const confirmError = state.errors?.confirmPassword?.[0];

  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === newPassword;

  return (
    <Card className="w-full border-border/70 shadow-xl shadow-black/5">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Reset your password</CardTitle>

        <CardDescription>{describeResetIntro(returnTo)}</CardDescription>
      </CardHeader>

      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-5">
          {returnTo ? <input type="hidden" name="next" value={returnTo} /> : null}

          {state.message ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {state.message}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>

            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              className="h-10"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? "email-error" : undefined}
              required
            />

            {emailError ? (
              <p id="email-error" className="text-sm text-destructive">
                {emailError}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="recoveryKey">Recovery key</Label>

            <Input
              id="recoveryKey"
              name="recoveryKey"
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
              className="h-10 font-mono tracking-wider"
              value={recoveryKey}
              onChange={(event) => setRecoveryKey(event.target.value)}
              aria-invalid={Boolean(keyError)}
              aria-describedby={keyError ? "recovery-key-error" : "recovery-key-hint"}
              required
            />

            <p id="recovery-key-hint" className="text-xs text-muted-foreground">
              24 letters and numbers. Dashes and spaces are fine.
            </p>

            {keyError ? (
              <p id="recovery-key-error" className="text-sm text-destructive">
                {keyError}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>

            <PasswordInput
              id="newPassword"
              name="newPassword"
              autoComplete="new-password"
              toggleLabel="Show new password"
              invalid={Boolean(passwordError)}
              describedBy={
                passwordError
                  ? "new-password-requirements new-password-error"
                  : "new-password-requirements"
              }
              minLength={PASSWORD_MIN_LENGTH}
              maxLength={PASSWORD_MAX_LENGTH}
              value={newPassword}
              onValueChange={setNewPassword}
            />

            <PasswordChecklist
              id="new-password-requirements"
              checks={getAccountPasswordChecks(newPassword)}
            />

            {passwordError ? (
              <p id="new-password-error" className="text-sm text-destructive">
                {passwordError}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>

            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              toggleLabel="Show confirmed password"
              invalid={Boolean(confirmError)}
              describedBy={confirmError ? "confirm-error" : undefined}
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
                  : "Passwords do not match yet"}
            </p>

            {confirmError ? (
              <p id="confirm-error" className="text-sm text-destructive">
                {confirmError}
              </p>
            ) : null}
          </div>

          <AuthSubmitButton idleLabel="Reset password" pendingLabel="Resetting password..." />
        </form>
      </CardContent>

      <CardFooter className="flex-col gap-2 border-t py-5 text-center text-sm text-muted-foreground">
        <p>
          Remembered it?{" "}
          <Link
            href={authPageHref("/login", { next: returnTo })}
            className="touch-reach ml-1 font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>

        <p className="text-xs">
          Lost both your password and your recovery key? The account cannot be recovered.
        </p>
      </CardFooter>
    </Card>
  );
}
