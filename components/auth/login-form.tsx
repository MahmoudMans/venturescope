"use client";

import Link from "next/link";
import { useActionState } from "react";

import { loginAction } from "@/app/(auth)/login/actions";
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
import { initialLoginFormState } from "@/lib/auth/form-state";

export function LoginForm() {
  const [
    state,
    formAction,
  ] = useActionState(
    loginAction,
    initialLoginFormState,
  );

  return (
    <Card className="w-full border-border/70 shadow-xl shadow-black/5">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">
          Welcome back
        </CardTitle>

        <CardDescription>
          Sign in to continue to your VentureScope workspace.
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
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="password">
                Password
              </Label>

              <span className="text-xs text-muted-foreground">
                Password recovery comes later
              </span>
            </div>

            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={
                Boolean(state.errors?.password)
              }
              required
            />

            {state.errors?.password?.[0] ? (
              <p className="text-sm text-destructive">
                {state.errors.password[0]}
              </p>
            ) : null}
          </div>

          <AuthSubmitButton
            idleLabel="Sign in"
            pendingLabel="Signing in..."
          />
        </form>
      </CardContent>

      <CardFooter className="justify-center border-t py-5 text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="ml-1 font-medium text-foreground underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </CardFooter>
    </Card>
  );
}
