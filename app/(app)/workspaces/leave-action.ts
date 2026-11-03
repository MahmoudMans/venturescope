"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCurrentUserIdentity } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";

/**
 * A collaborator leaves a workspace. Owners cannot leave (they can delete the
 * workspace instead), so only a membership row of the signed-in person counts.
 */
export async function leaveWorkspaceAction(formData: FormData): Promise<void> {
  const user = await requireCurrentUserIdentity();

  const raw = formData.get("workspaceId");

  const workspaceId = typeof raw === "string" ? raw.trim() : "";

  const membership =
    workspaceId === ""
      ? null
      : await prisma.workspaceMember.findFirst({
          where: {
            workspaceId,

            userId: user.id,
          },

          select: {
            id: true,
          },
        });

  if (membership === null) {
    redirect("/workspaces?status=not-a-member");
  }

  // The models this person shared become private again, then the membership ends.
  await prisma.$transaction([
    prisma.project.updateMany({
      where: {
        workspaceId,

        userId: user.id,
      },

      data: {
        workspaceId: null,
      },
    }),

    prisma.workspaceMember.delete({
      where: {
        id: membership.id,
      },
    }),
  ]);

  revalidatePath("/workspaces");

  revalidatePath(`/workspaces/${workspaceId}`);

  redirect("/workspaces?status=workspace-left");
}
