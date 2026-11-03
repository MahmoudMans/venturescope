import {
  CalendarDays,
  Download,
  Folders,
  Mail,
  ShieldCheck,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/app/page-header";
import { StatusNotice } from "@/components/app/status-notice";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DATA_EXPORT_LEFT_OUT_NOTE, DATA_EXPORT_PATH } from "@/lib/account/data-export-info";
import {
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_NAME_MIN_LENGTH,
  formatMemberSince,
  getProfileNotice,
} from "@/lib/account/profile";
import { requireCurrentUserIdentity } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { formatCount } from "@/lib/workspaces/labels";

import { updateProfileAction } from "./actions";

export const metadata: Metadata = {
  title: "Profile",

  robots: {
    index: false,

    follow: false,
  },
};

const sectionTitle = "font-heading text-lg font-medium leading-snug";

function SectionIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div
      aria-hidden="true"
      className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground"
    >
      <Icon className="size-5" />
    </div>
  );
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string | string[];
  }>;
}) {
  const identity = await requireCurrentUserIdentity();

  const { status } = await searchParams;

  const notice = getProfileNotice(status);

  const account = await prisma.user.findUnique({
    where: {
      id: identity.id,
    },

    select: {
      name: true,

      email: true,

      createdAt: true,

      _count: {
        select: {
          projects: true,

          ownedWorkspaces: true,

          workspaceMemberships: true,
        },
      },
    },
  });

  if (account === null) {
    notFound();
  }

  const workspaceCount = account._count.ownedWorkspaces + account._count.workspaceMemberships;

  const facts = [
    {
      icon: Mail,
      label: "Email address",
      value: account.email,
    },

    {
      icon: CalendarDays,
      label: "Member since",
      value: formatMemberSince(account.createdAt),
    },

    {
      icon: Folders,
      label: "Financial models",
      value: formatCount(account._count.projects, "model"),
    },

    {
      icon: Users,
      label: "Workspaces",
      value: formatCount(workspaceCount, "workspace"),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-5 py-8 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Choose the name that you and your collaborators see across VentureScope."
      />

      {notice ? <StatusNotice tone={notice.tone}>{notice.message}</StatusNotice> : null}

      <Card className="[--card-spacing:--spacing(6)]">
        <CardHeader>
          <div className="flex items-start gap-4">
            <SectionIcon icon={UserRound} />

            <div className="space-y-1">
              <h2 className={sectionTitle}>Display name</h2>

              <CardDescription>
                Shown in the sidebar and in the collaborator lists of your workspaces.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form
            action={updateProfileAction}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1 space-y-2">
              <Label htmlFor="profile-name">Name</Label>

              <Input
                id="profile-name"
                name="name"
                required
                autoComplete="name"
                minLength={DISPLAY_NAME_MIN_LENGTH}
                maxLength={DISPLAY_NAME_MAX_LENGTH}
                defaultValue={account.name}
                className="h-10"
              />
            </div>

            <SubmitButton size="lg" pendingLabel="Saving...">
              Save name
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card className="[--card-spacing:--spacing(6)]">
        <CardHeader>
          <div className="space-y-1">
            <h2 className={sectionTitle}>Account details</h2>

            <CardDescription>
              You sign in with your email address.{" "}
              <Link
                href="/account/security#email"
                className="font-medium text-foreground underline underline-offset-4"
              >
                Change it in Security
              </Link>
              .
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            {facts.map((fact) => (
              <div key={fact.label} className="flex items-start gap-3 rounded-xl border p-4">
                <fact.icon
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />

                <div className="min-w-0">
                  <dt className="text-xs text-muted-foreground">{fact.label}</dt>

                  <dd className="mt-0.5 break-words text-sm font-medium">{fact.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card id="your-data" className="[--card-spacing:--spacing(6)]">
        <CardHeader>
          <div className="flex items-start gap-4">
            <SectionIcon icon={Download} />

            <div className="space-y-1">
              <h2 className={sectionTitle}>Your data</h2>

              <CardDescription>
                Download one ZIP file with your profile, your workspaces and the models you own.
                Each model comes with a backup file you can restore, and with CSV files of your
                results, targets and comments.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-muted-foreground">
            {formatCount(account._count.projects, "model")} will be included. Your password and
            recovery key are never part of the file. {DATA_EXPORT_LEFT_OUT_NOTE}
          </p>

          <Button asChild size="lg" className="shrink-0">
            <a href={DATA_EXPORT_PATH} download>
              <Download className="size-4" aria-hidden="true" />
              Download my data
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card className="[--card-spacing:--spacing(6)]">
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <SectionIcon icon={ShieldCheck} />

            <div className="space-y-1">
              <h2 className={sectionTitle}>Password and sessions</h2>

              <CardDescription>
                Change your password, sign out everywhere, or delete your account.
              </CardDescription>
            </div>
          </div>

          <Button asChild variant="outline" size="lg">
            <Link href="/account/security">Open security</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
