"use client";

import Link from "next/link";
import { useActionState } from "react";

import { registerAction } from "@/app/(auth)/register/actions";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
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

export function RegisterForm() {
  const [
    state,
    formAction,
  ] = useActionState(
    registerAction,
    initialRegisterFormState,
  );

  return (
    <Card className="w-full border-border/70 shadow-xl shadow-black/5">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">
          Create your account
        </CardTitle>

        <CardDescription>
          Start building financial models and scenario forecasts.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          action={formAction}
          className="space-y-5"
        >
          {state.message ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {state.message}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="name">
              Name
            </Label>

            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Mahmoud Mansouri"
              aria-invalid={
                Boolean(state.errors?.name)
              }
              required
            />

            {state.errors?.name?.[0] ? (
              <p className="text-sm text-destructive">
                {state.errors.name[0]}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email
            </Label>

            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              aria-invalid={
                Boolean(state.errors?.email)
              }
              required
            />

            {state.errors?.email?.[0] ? (
              <p className="text-sm text-destructive">
                {state.errors.email[0]}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Password
            </Label>

            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={
                Boolean(state.errors?.password)
              }
              required
            />

            <p className="text-xs leading-5 text-muted-foreground">
              At least 8 characters with uppercase, lowercase and a number.
            </p>

            {state.errors?.password?.[0] ? (
              <p className="text-sm text-destructive">
                {state.errors.password[0]}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              Confirm password
            </Label>

            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              aria-invalid={
                Boolean(
                  state.errors?.confirmPassword,
                )
              }
              required
            />

            {state.errors?.confirmPassword?.[0] ? (
              <p className="text-sm text-destructive">
                {
                  state.errors
                    .confirmPassword[0]
                }
              </p>
            ) : null}
          </div>

          <AuthSubmitButton
            idleLabel="Create account"
            pendingLabel="Creating account..."
          />
        </form>
      </CardContent>

      <CardFooter className="justify-center border-t py-5 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="ml-1 font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
