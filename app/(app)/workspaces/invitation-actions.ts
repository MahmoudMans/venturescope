"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCurrentUserIdentity } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { requireWorkspacePermission } from "@/lib/workspaces/access";
import { createInvitationLink } from "@/lib/workspaces/invitation-links";
import { toInvitationRole } from "@/lib/workspaces/invitation-state";

function formValue(formData: FormData, key: string): string {
  const candidate = formData.get(key);

  return typeof candidate === "string" ? candidate.trim() : "";
}

/**
 * The owner makes a new link for a person who already has an invitation, for example when the
 * link was lost or has expired. The old link stops working, and the new one is shown on the
 * workspace page the same way as a link from the invite form.
 */
export async function renewWorkspaceInvitationAction(formData: FormData): Promise<void> {
  const user = await requireCurrentUserIdentity();

  const workspaceId = formValue(formData, "workspaceId");

  const invitationId = formValue(formData, "invitationId");

  await requireWorkspacePermission(workspaceId, user.id, "OWNER");

  // Only a link of this workspace that was not accepted can be renewed.
  const invitation = await prisma.workspaceInvitation.findFirst({
    where: {
      id: invitationId,

      workspaceId,

      acceptedAt: null,
    },

    select: {
      emailNormalized: true,

      role: true,
    },
  });

  if (invitation === null) {
    redirect(`/workspaces/${workspaceId}?status=invitation-missing`);
  }

  // The person may have joined by another link since this one was made.
  const alreadyMember = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId,

      user: {
        email: invitation.emailNormalized,
      },
    },

    select: {
      id: true,
    },
  });

  if (alreadyMember !== null) {
    redirect(`/workspaces/${workspaceId}?status=already-member`);
  }

  const token = await createInvitationLink({
    workspaceId,

    email: invitation.emailNormalized,

    role: toInvitationRole(invitation.role),

    createdByUserId: user.id,
  });

  revalidatePath(`/workspaces/${workspaceId}`);

  redirect(`/workspaces/${workspaceId}?invite=${encodeURIComponent(token)}`);
}
