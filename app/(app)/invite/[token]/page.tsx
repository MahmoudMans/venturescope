import { CircleCheck, Clock, LayoutDashboard, LogOut, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { StatusNotice } from "@/components/app/status-notice";
import { SubmitButton } from "@/components/forms/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { requireCurrentUserIdentity } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import {
  INVITATION_DAYS,
  describeInvitationTiming,
  inviterLabel,
  viewInvitation,
} from "@/lib/workspaces/invitation-state";
import { hashInvitationToken } from "@/lib/workspaces/invitations";
import {
  getInvitationNotice,
  workspaceRoleDescription,
  workspaceRoleLabel,
} from "@/lib/workspaces/labels";

import { acceptWorkspaceInvitationAction } from "../../workspaces/actions";
import { switchInvitationAccountAction } from "../switch-account-action";

export const metadata: Metadata = {
  title: "Workspace Invitation",

  robots: {
    index: false,

    follow: false,
  },
};

export default async function InvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{
    token: string;
  }>;

  searchParams: Promise<{
    status?: string | string[];
  }>;
}) {
  const user = await requireCurrentUserIdentity();

  const { token } = await params;

  const { status } = await searchParams;

  const notice = getInvitationNotice(status);

  const invitation = await prisma.workspaceInvitation.findUnique({
    where: {
      tokenHash: hashInvitationToken(token),
    },

    include: {
      workspace: {
        select: {
          name: true,

          ownerId: true,

          members: {
            where: {
              userId: user.id,
            },

            select: {
              id: true,
            },

            take: 1,
          },
        },
      },

      createdBy: {
        select: {
          name: true,
        },
      },
    },
  });

  if (invitation === null) {
    notFound();
  }

  const emailMatches = invitation.emailNormalized === user.email;

  const now = new Date();

  const view = viewInvitation({
    acceptedAt: invitation.acceptedAt,

    expiresAt: invitation.expiresAt,

    emailMatches,

    personIsInside:
      invitation.workspace.ownerId === user.id || invitation.workspace.members.length > 0,

    now,
  });

  // A link that cannot be used shows one friendly page, whatever the reason.
  if (view.kind === "missing") {
    notFound();
  }

  // The person is already in the workspace, so there is nothing left to accept.
  if (view.kind === "joined") {
    redirect(`/workspaces/${invitation.workspaceId}?status=already-joined`);
  }

  if (view.kind === "expired") {
    return (
      <div className="mx-auto w-full max-w-xl space-y-4 px-5 py-12">
        <Card className="[--card-spacing:--spacing(6)]">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div
                aria-hidden="true"
                className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-warning/14 text-warning"
              >
                <Clock className="size-6" />
              </div>

              <div className="min-w-0 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  Workspace invitation
                </p>

                <h1 className="text-2xl font-semibold tracking-tight">
                  {invitation.workspace.name}
                </h1>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <StatusNotice tone="info">
              This invitation expired on {view.expiredOn}. A link works for {INVITATION_DAYS} days.
              Ask {inviterLabel(invitation.createdBy.name)} to create a new link for {user.email}.
            </StatusNotice>

            <Button asChild variant="outline" size="lg">
              <Link href="/dashboard">
                <LayoutDashboard className="size-4" aria-hidden="true" />
                Go to dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 px-5 py-12">
      {notice ? <StatusNotice tone={notice.tone}>{notice.message}</StatusNotice> : null}

      <Card className="[--card-spacing:--spacing(6)]">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div
              aria-hidden="true"
              className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-sm"
            >
              <Users className="size-6" />
            </div>

            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Workspace invitation
              </p>

              <h1 className="text-2xl font-semibold tracking-tight">{invitation.workspace.name}</h1>

              {emailMatches ? (
                <p className="text-sm text-muted-foreground">
                  Invited by {inviterLabel(invitation.createdBy.name)}
                </p>
              ) : null}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <p className="flex flex-wrap items-center gap-2 text-sm">
              You were invited as
              <Badge>{workspaceRoleLabel(invitation.role)}</Badge>
            </p>

            <CardDescription>{workspaceRoleDescription(invitation.role)}</CardDescription>

            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3" aria-hidden="true" />
              {describeInvitationTiming(invitation.expiresAt, now)}
            </p>
          </div>

          {emailMatches ? (
            <form action={acceptWorkspaceInvitationAction} className="flex flex-wrap gap-3">
              <input type="hidden" name="token" value={token} />

              <SubmitButton size="lg" pendingLabel="Joining...">
                <CircleCheck className="size-4" aria-hidden="true" />
                Accept invitation
              </SubmitButton>

              <Button asChild variant="outline" size="lg">
                <Link href="/dashboard">Not now</Link>
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <StatusNotice tone="error">
                This invitation was issued to a different email address. You are signed in as{" "}
                {user.email}. Sign out, then sign in or create an account with the invited address
                to accept it.
              </StatusNotice>

              <form action={switchInvitationAccountAction}>
                <input type="hidden" name="token" value={token} />

                <SubmitButton variant="outline" pendingLabel="Signing out...">
                  <LogOut className="size-4" aria-hidden="true" />
                  Sign out and use another account
                </SubmitButton>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
