import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import {
  prisma,
} from "@/lib/db/prisma";

import {
  requireCurrentUserIdentity,
} from "@/lib/auth/current-user";

import {
  hashInvitationToken,
} from "@/lib/workspaces/invitations";

import {
  acceptWorkspaceInvitationAction,
} from "../../workspaces/actions";


export const metadata: Metadata = {
  title:
    "Workspace Invitation",

  robots: {
    index:
      false,

    follow:
      false,
  },
};


export default async function InvitationPage({
  params,
}: {
  params:
    Promise<{
      token:
        string;
    }>;
}) {
  const user =
    await requireCurrentUserIdentity();


  const {
    token,
  } =
    await params;


  const invitation =
    await prisma.workspaceInvitation.findUnique({
      where: {
        tokenHash:
          hashInvitationToken(
            token,
          ),
      },

      include: {
        workspace: {
          select: {
            name:
              true,
          },
        },
      },
    });


  if (
    !invitation ||
    invitation.acceptedAt ||
    invitation.expiresAt <=
      new Date()
  ) {
    notFound();
  }


  const emailMatches =
    invitation.emailNormalized ===
    user.email;


  return (
    <main className="mx-auto w-full max-w-xl px-5 py-12">
      <div className="rounded-xl border bg-background p-6">
        <p className="text-sm font-medium text-muted-foreground">
          Workspace invitation
        </p>

        <h1 className="mt-2 text-2xl font-semibold">
          {
            invitation.workspace
              .name
          }
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          You were invited as{" "}
          <strong>
            {
              invitation.role
            }
          </strong>
          .
        </p>

        {
          emailMatches
            ?
              (
                <form
                  action={
                    acceptWorkspaceInvitationAction
                  }
                  className="mt-6"
                >
                  <input
                    type="hidden"
                    name="token"
                    value={
                      token
                    }
                  />

                  <button
                    type="submit"
                    className="h-10 rounded-lg bg-foreground px-4 text-sm font-medium text-background"
                  >
                    Accept invitation
                  </button>
                </form>
              )
            :
              (
                <div className="mt-6 rounded-lg border p-4 text-sm text-muted-foreground">
                  This invitation was issued to a different email address.
                </div>
              )
        }
      </div>
    </main>
  );
}
