import {
  KeyRound,
  LifeBuoy,
  Mail,
  MonitorSmartphone,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ChangeEmailForm } from "@/components/account/change-email-form";
import { ChangePasswordForm } from "@/components/account/change-password-form";
import { DeleteAccountForm } from "@/components/account/delete-account-form";
import { RecoveryKeyForm } from "@/components/account/recovery-key-form";
import { SecurityCheckupCard } from "@/components/account/security-checkup-card";
import { PageHeader } from "@/components/app/page-header";
import { StatusNotice } from "@/components/app/status-notice";
import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { DATA_EXPORT_PATH } from "@/lib/account/data-export-info";
import { EMAIL_CHANGE_MESSAGES } from "@/lib/account/email-change";
import { loadSecurityCheckup } from "@/lib/account/load-security-checkup";
import { cn } from "@/lib/utils";

import { logoutAllDevicesAction } from "./actions";

export const metadata: Metadata = {
  title: "Account Security",

  robots: {
    index: false,

    follow: false,
  },
};

const messages: Record<string, string> = {
  ...EMAIL_CHANGE_MESSAGES,

  "password-mismatch": "The new password confirmation does not match.",

  "password-policy": "The new password does not satisfy the security policy.",

  "wrong-password": "The current password is incorrect.",

  "same-password": "Choose a password different from your current password.",

  "delete-confirmation": 'Type "DELETE MY ACCOUNT" exactly to confirm deletion.',

  "delete-password": "The account password is incorrect.",
};

const sectionTitle = "font-heading text-lg font-medium leading-snug";

function SectionIcon({ icon: Icon, tone }: { icon: LucideIcon; tone: "primary" | "danger" }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl",
        tone === "danger"
          ? "bg-destructive/10 text-destructive"
          : "bg-accent text-accent-foreground",
      )}
    >
      <Icon className="size-5" />
    </div>
  );
}

export default async function AccountSecurityPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
  }>;
}) {
  const session = await auth();

  if (Boolean(session?.user) === false) {
    redirect("/login");
  }

  const params = await searchParams;

  const message =
    params.status !== undefined && Object.hasOwn(messages, params.status)
      ? messages[params.status]
      : undefined;

  const checkup = await loadSecurityCheckup(session?.user?.id ?? "");

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-5 py-8 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Account"
        title="Security"
        description="Manage your email address, password and recovery key, invalidate active sessions, or permanently delete your VentureScope account."
      />

      {message ? <StatusNotice tone="error">{message}</StatusNotice> : null}

      {checkup === null ? null : <SecurityCheckupCard items={checkup} />}

      <Card id="email" className="[--card-spacing:--spacing(6)]">
        <CardHeader>
          <div className="flex items-start gap-4">
            <SectionIcon icon={Mail} tone="primary" />

            <div className="space-y-1">
              <h2 className={sectionTitle}>Email address</h2>

              <CardDescription>
                You sign in with your email address. Changing it also invalidates every previously
                issued VentureScope session.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <ChangeEmailForm currentEmail={session?.user?.email ?? ""} />
        </CardContent>
      </Card>

      <Card id="password" className="[--card-spacing:--spacing(6)]">
        <CardHeader>
          <div className="flex items-start gap-4">
            <SectionIcon icon={KeyRound} tone="primary" />

            <div className="space-y-1">
              <h2 className={sectionTitle}>Change password</h2>

              <CardDescription>
                Changing your password also invalidates every previously issued VentureScope
                session.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <Card id="recovery-key" className="[--card-spacing:--spacing(6)]">
        <CardHeader>
          <div className="flex items-start gap-4">
            <SectionIcon icon={LifeBuoy} tone="primary" />

            <div className="space-y-1">
              <h2 className={sectionTitle}>Recovery key</h2>

              <CardDescription>
                VentureScope sends no emails, so this key is the only way to reset a forgotten
                password. Enter your password to show it, and keep it somewhere safe.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <RecoveryKeyForm />
        </CardContent>
      </Card>

      <Card className="[--card-spacing:--spacing(6)]">
        <CardHeader>
          <div className="flex items-start gap-4">
            <SectionIcon icon={MonitorSmartphone} tone="primary" />

            <div className="space-y-1">
              <h2 className={sectionTitle}>Active sessions</h2>

              <CardDescription>
                Invalidate every existing login session, including this browser. Use it if you
                signed in on a shared or lost device.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form action={logoutAllDevicesAction}>
            <SubmitButton variant="outline" size="lg" pendingLabel="Signing out...">
              Log out all devices
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/40 bg-destructive/5 ring-destructive/20 [--card-spacing:--spacing(6)]">
        <CardHeader>
          <div className="flex items-start gap-4">
            <SectionIcon icon={TriangleAlert} tone="danger" />

            <div className="space-y-1">
              <h2 className={cn(sectionTitle, "text-destructive")}>Delete account</h2>

              <CardDescription>
                This permanently removes your VentureScope account and all projects, scenarios,
                financing events, and monthly overrides owned by it. It cannot be undone.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">
            Before you delete your account,{" "}
            <a
              href={DATA_EXPORT_PATH}
              download
              className="font-medium text-foreground underline underline-offset-4"
            >
              download a copy of your data
            </a>
            . Deleting your account cannot be undone.
          </p>

          <p className="text-sm leading-6 text-muted-foreground">
            Workspaces that you own are deleted with your account. If other people still use one,
            open it and use <span className="font-medium text-foreground">Transfer ownership</span>{" "}
            first.
          </p>

          <DeleteAccountForm />
        </CardContent>
      </Card>
    </div>
  );
}
