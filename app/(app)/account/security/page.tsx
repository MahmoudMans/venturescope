import type {
  Metadata,
} from "next";

import {
  redirect,
} from "next/navigation";

import {
  auth,
} from "@/auth";

import {
  changePasswordAction,
  deleteAccountAction,
  logoutAllDevicesAction,
} from "./actions";


export const metadata: Metadata = {
  title:
    "Account Security",

  robots: {
    index:
      false,

    follow:
      false,
  },
};


const messages:
  Record<
    string,
    string
  > = {
    "password-mismatch":
      "The new password confirmation does not match.",

    "password-policy":
      "The new password does not satisfy the security policy.",

    "wrong-password":
      "The current password is incorrect.",

    "same-password":
      "Choose a password different from your current password.",

    "delete-confirmation":
      'Type "DELETE MY ACCOUNT" exactly to confirm deletion.',

    "delete-password":
      "The account password is incorrect.",
  };


export default async function AccountSecurityPage({
  searchParams,
}: {
  searchParams:
    Promise<{
      status?:
        string;
    }>;
}) {
  const session =
    await auth();


  if (
    !session?.user
  ) {
    redirect(
      "/login",
    );
  }


  const params =
    await searchParams;


  const message =
    params.status
      ?
        messages[
          params.status
        ]
      :
        undefined;


  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <header className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Account
        </p>

        <h1 className="text-3xl font-semibold tracking-tight">
          Security
        </h1>

        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Manage your password, invalidate active sessions, or permanently delete your VentureScope account.
        </p>
      </header>

      {
        message
          ?
            (
              <div
                role="status"
                className="rounded-xl border bg-muted/40 px-4 py-3 text-sm"
              >
                {
                  message
                }
              </div>
            )
          :
            null
      }

      <section className="rounded-xl border bg-background p-5 sm:p-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">
            Change password
          </h2>

          <p className="text-sm text-muted-foreground">
            Changing your password also invalidates every previously issued VentureScope session.
          </p>
        </div>

        <form
          action={
            changePasswordAction
          }
          className="mt-6 space-y-4"
        >
          <label className="block space-y-2">
            <span className="text-sm font-medium">
              Current password
            </span>

            <input
              required
              autoComplete="current-password"
              name="currentPassword"
              type="password"
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">
              New password
            </span>

            <input
              required
              minLength={
                12
              }
              maxLength={
                128
              }
              autoComplete="new-password"
              name="newPassword"
              type="password"
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">
              Confirm new password
            </span>

            <input
              required
              minLength={
                12
              }
              maxLength={
                128
              }
              autoComplete="new-password"
              name="confirmPassword"
              type="password"
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          <p className="text-xs leading-5 text-muted-foreground">
            Use at least 12 characters with uppercase, lowercase, number, and symbol characters.
          </p>

          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-foreground px-4 text-sm font-medium text-background"
          >
            Change password
          </button>
        </form>
      </section>

      <section className="rounded-xl border bg-background p-5 sm:p-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">
            Active sessions
          </h2>

          <p className="text-sm leading-6 text-muted-foreground">
            Invalidate every existing login session, including this browser.
          </p>
        </div>

        <form
          action={
            logoutAllDevicesAction
          }
          className="mt-5"
        >
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-medium"
          >
            Log out all devices
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-destructive/40 bg-destructive/5 p-5 sm:p-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-destructive">
            Delete account
          </h2>

          <p className="text-sm leading-6 text-muted-foreground">
            This permanently removes your VentureScope account and all projects, scenarios, financing events, and monthly overrides owned by it.
          </p>
        </div>

        <form
          action={
            deleteAccountAction
          }
          className="mt-6 space-y-4"
        >
          <label className="block space-y-2">
            <span className="text-sm font-medium">
              Current password
            </span>

            <input
              required
              autoComplete="current-password"
              name="password"
              type="password"
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">
              Type DELETE MY ACCOUNT
            </span>

            <input
              required
              autoComplete="off"
              name="confirmation"
              type="text"
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-destructive px-4 text-sm font-medium text-destructive-foreground"
          >
            Permanently delete account
          </button>
        </form>
      </section>
    </main>
  );
}
