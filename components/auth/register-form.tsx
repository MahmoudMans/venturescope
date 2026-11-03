"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { registerAction } from "@/app/(auth)/register/actions";
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
import { initialRegisterFormState } from "@/lib/auth/form-state";
import { getRegistrationPasswordChecks } from "@/lib/auth/password-checks";
import { authPageHref, describeRegisterIntro } from "@/lib/auth/return-path";
import { cn } from "@/lib/utils";

export function RegisterForm({ returnTo = null }: { returnTo?: string | null }) {
  const [state, formAction] = useActionState(registerAction, initialRegisterFormState);

  const formRef = useFormErrorRecovery(state.errors);

  // Controlled so typed values survive the form reset that follows a failed attempt.
  const [name, setName] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const nameError = state.errors?.name?.[0];

  const emailError = state.errors?.email?.[0];

  const passwordError = state.errors?.password?.[0];

  const confirmError = state.errors?.confirmPassword?.[0];

  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === password;

  return (
    <Card className="w-full border-border/70 shadow-xl shadow-black/5">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Create your account</CardTitle>

        <CardDescription>{describeRegisterIntro(returnTo)}</CardDescription>
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
            <Label htmlFor="name">Name</Label>

            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Mahmoud Mansouri"
              className="h-10"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? "name-error" : undefined}
              required
            />

            {nameError ? (
              <p id="name-error" className="text-sm text-destructive">
                {nameError}
              </p>
            ) : null}
          </div>

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
            <Label htmlFor="password">Password</Label>

            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              invalid={Boolean(passwordError)}
              describedBy={
                passwordError ? "password-requirements password-error" : "password-requirements"
              }
              value={password}
              onValueChange={setPassword}
            />

            <PasswordChecklist
              id="password-requirements"
              checks={getRegistrationPasswordChecks(password)}
            />

            {passwordError ? (
              <p id="password-error" className="text-sm text-destructive">
                {passwordError}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>

            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              toggleLabel="Show confirm password"
              invalid={Boolean(confirmError)}
              describedBy={confirmError ? "confirm-error" : undefined}
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

            {confirmError ? (
              <p id="confirm-error" className="text-sm text-destructive">
                {confirmError}
              </p>
            ) : null}
          </div>

          <AuthSubmitButton idleLabel="Create account" pendingLabel="Creating account..." />

          <p className="text-center text-xs leading-5 text-muted-foreground">
            By creating an account you agree to the{" "}
            <Link
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Terms of use
            </Link>{" "}
            and the{" "}
            <Link
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Privacy notice
            </Link>
            .
          </p>
        </form>
      </CardContent>

      <CardFooter className="justify-center border-t py-5 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={authPageHref("/login", { next: returnTo })}
          className="touch-reach ml-1 font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
