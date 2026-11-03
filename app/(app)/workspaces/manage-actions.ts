"use server";

import { compare } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCurrentUserIdentity } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { logAccountSecurityEvent } from "@/lib/security/account-events";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { requireWorkspacePermission } from "@/lib/workspaces/access";
import {
  FORMER_OWNER_ROLE,
  TRANSFER_LIMIT,
  TRANSFER_WINDOW_MS,
  normalizeWorkspaceName,
} from "@/lib/workspaces/manage";

function field(formData: FormData, key: string): string {
  const candidate = formData.get(key);

  return typeof candidate === "string" ? candidate : "";
}

/**
 * Sends the person back to the workspace page. Only a fixed code goes into the
 * address, and the workspace id was already checked against the database.
 */
function back(workspaceId: string, status: string): never {
  redirect(`/workspaces/${workspaceId}?status=${status}`);
}

/** The owner changes the name of the workspace. */
export async function renameWorkspaceAction(formData: FormData): Promise<void> {
  const user = await requireCurrentUserIdentity();

  const workspaceId = field(formData, "workspaceId").trim();

  await requireWorkspacePermission(workspaceId, user.id, "OWNER");

  const next = normalizeWorkspaceName(field(formData, "name"));

  if (next.ok === false) {
    back(workspaceId, "invalid-name");
  }

  const renamed = await prisma.workspace.updateMany({
    where: {
      id: workspaceId,

      ownerId: user.id,
    },

    data: {
      name: next.name,
    },
  });

  if (renamed.count !== 1) {
    back(workspaceId, "not-owner");
  }

  revalidatePath("/workspaces");

  revalidatePath(`/workspaces/${workspaceId}`);

  back(workspaceId, "workspace-renamed");
}

/**
 * The owner gives the workspace to one of its collaborators. It needs the
 * password of the owner. The old owner stays in the workspace as an editor, and
 * every model keeps its own owner. The log never contains an email address.
 */
export async function transferWorkspaceOwnershipAction(formData: FormData): Promise<void> {
  const user = await requireCurrentUserIdentity();

  const workspaceId = field(formData, "workspaceId").trim();

  await requireWorkspacePermission(workspaceId, user.id, "OWNER");

  const attempts = checkRateLimit({
    key: `workspace-transfer:${user.id}`,

    limit: TRANSFER_LIMIT,

    windowMs: TRANSFER_WINDOW_MS,
  });

  if (attempts.allowed === false) {
    logAccountSecurityEvent("workspace.transfer.rejected", user.id, {
      workspaceId,

      reason: "rate-limit",
    });

    back(workspaceId, "transfer-rate-limit");
  }

  const memberId = field(formData, "memberId").trim();

  const member =
    memberId === ""
      ? null
      : await prisma.workspaceMember.findFirst({
          where: {
            id: memberId,

            workspaceId,

            userId: {
              not: user.id,
            },
          },

          select: {
            id: true,

            userId: true,
          },
        });

  if (member === null) {
    back(workspaceId, "transfer-no-member");
  }

  const account = await prisma.user.findUnique({
    where: {
      id: user.id,
    },

    select: {
      passwordHash: true,
    },
  });

  if (account === null) {
    redirect("/login");
  }

  const passwordMatches = await compare(field(formData, "password"), account.passwordHash);

  if (passwordMatches === false) {
    logAccountSecurityEvent("workspace.transfer.rejected", user.id, {
      workspaceId,

      reason: "password",
    });

    back(workspaceId, "transfer-password");
  }

  const moved = await prisma.$transaction(async (transaction) => {
    const changed = await transaction.workspace.updateMany({
      where: {
        id: workspaceId,

        ownerId: user.id,

        members: {
          some: {
            id: member.id,

            userId: member.userId,
          },
        },
      },

      data: {
        ownerId: member.userId,
      },
    });

    if (changed.count !== 1) {
      return false;
    }

    await transaction.workspaceMember.deleteMany({
      where: {
        workspaceId,

        userId: member.userId,
      },
    });

    await transaction.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId,

          userId: user.id,
        },
      },

      update: {
        role: FORMER_OWNER_ROLE,
      },

      create: {
        workspaceId,

        userId: user.id,

        role: FORMER_OWNER_ROLE,
      },
    });

    return true;
  });

  if (moved === false) {
    logAccountSecurityEvent("workspace.transfer.rejected", user.id, {
      workspaceId,

      reason: "changed",
    });

    back(workspaceId, "transfer-changed");
  }

  logAccountSecurityEvent("workspace.transferred", user.id, {
    workspaceId,

    newOwnerUserId: member.userId,
  });

  revalidatePath("/workspaces");

  revalidatePath(`/workspaces/${workspaceId}`);

  back(workspaceId, "ownership-transferred");
}
