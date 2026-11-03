"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { loginAction } from "@/app/(auth)/login/actions";
import { StatusNotice } from "@/components/app/status-notice";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
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
import { initialLoginFormState } from "@/lib/auth/form-state";
import type { LoginNotice } from "@/lib/auth/login-notices";
import { authPageHref, describeLoginIntro } from "@/lib/auth/return-path";

export function LoginForm({
  notice = null,
  returnTo = null,
}: {
  notice?: LoginNotice | null;

  /** The page the person wanted before they had to sign in. */
  returnTo?: string | null;
}) {
  const [state, formAction] = useActionState(loginAction, initialLoginFormState);

  const formRef = useFormErrorRecovery(state.errors);

  // Controlled so the email survives the form reset that follows a failed attempt.
  const [email, setEmail] = useState("");

  const emailError = state.errors?.email?.[0];

  const passwordError = state.errors?.password?.[0];

  return (
    <Card className="w-full border-border/70 shadow-xl shadow-black/5">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Welcome back</CardTitle>

        <CardDescription>{describeLoginIntro(returnTo)}</CardDescription>
      </CardHeader>

      <CardContent>
        {notice ? (
          <StatusNotice tone={notice.tone} title={notice.title} className="mb-5">
            {notice.message}
          </StatusNotice>
        ) : null}

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
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="password">Password</Label>

              <Link
                href={authPageHref("/forgot-password", { next: returnTo })}
                className="touch-target inline-flex items-center text-xs font-medium [@media(pointer:coarse)]:-my-3 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              invalid={Boolean(passwordError)}
              describedBy={passwordError ? "password-error" : undefined}
            />

            {passwordError ? (
              <p id="password-error" className="text-sm text-destructive">
                {passwordError}
              </p>
            ) : null}
          </div>

          <AuthSubmitButton idleLabel="Sign in" pendingLabel="Signing in..." />
        </form>
      </CardContent>

      <CardFooter className="justify-center border-t py-5 text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href={authPageHref("/register", { next: returnTo })}
          className="touch-reach ml-1 font-medium text-foreground underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </CardFooter>
    </Card>
  );
}
