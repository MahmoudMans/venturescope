"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  redirect,
} from "next/navigation";

import {
  prisma,
} from "@/lib/db/prisma";

import {
  requireCurrentUserIdentity,
} from "@/lib/auth/current-user";

import {
  createInvitationToken,
  hashInvitationToken,
  invitationExpiry,
  normalizeInvitationEmail,
} from "@/lib/workspaces/invitations";

import {
  requireWorkspacePermission,
} from "@/lib/workspaces/access";


function formValue(
  formData:
    FormData,
  key:
    string,
): string {
  const candidate =
    formData.get(
      key,
    );


  return (
    typeof candidate ===
      "string"
      ?
        candidate.trim()
      :
        ""
  );
}


function safeRole(
  value:
    string,
):
  | "EDITOR"
  | "VIEWER" {
  return (
    value ===
    "EDITOR"
      ?
        "EDITOR"
      :
        "VIEWER"
  );
}


export async function createWorkspaceAction(
  formData:
    FormData,
): Promise<void> {
  const user =
    await requireCurrentUserIdentity();


  const name =
    formValue(
      formData,
      "name",
    );


  if (
    name.length <
      2 ||
    name.length >
      80
  ) {
    redirect(
      "/workspaces?status=invalid-name",
    );
  }


  const workspace =
    await prisma.workspace.create({
      data: {
        name,

        ownerId:
          user.id,
      },
    });


  redirect(
    `/workspaces/${workspace.id}`,
  );
}


export async function inviteWorkspaceMemberAction(
  formData:
    FormData,
): Promise<void> {
  const user =
    await requireCurrentUserIdentity();


  const workspaceId =
    formValue(
      formData,
      "workspaceId",
    );


  await requireWorkspacePermission(
    workspaceId,
    user.id,
    "OWNER",
  );


  const email =
    normalizeInvitationEmail(
      formValue(
        formData,
        "email",
      ),
    );


  if (
    !email.includes(
      "@",
    ) ||
    email.length >
      254
  ) {
    redirect(
      `/workspaces/${workspaceId}?status=invalid-email`,
    );
  }


  if (
    email ===
    user.email
  ) {
    redirect(
      `/workspaces/${workspaceId}?status=self-invite`,
    );
  }


  const role =
    safeRole(
      formValue(
        formData,
        "role",
      ),
    );


  const token =
    createInvitationToken();


  await prisma.workspaceInvitation.create({
    data: {
      workspaceId,

      emailNormalized:
        email,

      role,

      tokenHash:
        hashInvitationToken(
          token,
        ),

      expiresAt:
        invitationExpiry(),

      createdByUserId:
        user.id,
    },
  });


  revalidatePath(
    `/workspaces/${workspaceId}`,
  );


  redirect(
    `/workspaces/${workspaceId}?invite=${encodeURIComponent(
      token,
    )}`,
  );
}


export async function acceptWorkspaceInvitationAction(
  formData:
    FormData,
): Promise<void> {
  const user =
    await requireCurrentUserIdentity();


  const token =
    formValue(
      formData,
      "token",
    );


  const invitation =
    await prisma.workspaceInvitation.findUnique({
      where: {
        tokenHash:
          hashInvitationToken(
            token,
          ),
      },
    });


  if (
    !invitation ||
    invitation.acceptedAt ||
    invitation.expiresAt <=
      new Date() ||
    invitation.emailNormalized !==
      user.email
  ) {
    redirect(
      `/invite/${encodeURIComponent(
        token,
      )}?status=invalid`,
    );
  }


  await prisma.$transaction([
    prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId:
            invitation.workspaceId,

          userId:
            user.id,
        },
      },

      update: {
        role:
          invitation.role,
      },

      create: {
        workspaceId:
          invitation.workspaceId,

        userId:
          user.id,

        role:
          invitation.role,
      },
    }),

    prisma.workspaceInvitation.update({
      where: {
        id:
          invitation.id,
      },

      data: {
        acceptedAt:
          new Date(),
      },
    }),
  ]);


  redirect(
    `/workspaces/${invitation.workspaceId}`,
  );
}


export async function updateWorkspaceMemberRoleAction(
  formData:
    FormData,
): Promise<void> {
  const user =
    await requireCurrentUserIdentity();


  const workspaceId =
    formValue(
      formData,
      "workspaceId",
    );


  const memberId =
    formValue(
      formData,
      "memberId",
    );


  const role =
    safeRole(
      formValue(
        formData,
        "role",
      ),
    );


  await requireWorkspacePermission(
    workspaceId,
    user.id,
    "OWNER",
  );


  await prisma.workspaceMember.updateMany({
    where: {
      id:
        memberId,

      workspaceId,
    },

    data: {
      role,
    },
  });


  revalidatePath(
    `/workspaces/${workspaceId}`,
  );
}


export async function removeWorkspaceMemberAction(
  formData:
    FormData,
): Promise<void> {
  const user =
    await requireCurrentUserIdentity();


  const workspaceId =
    formValue(
      formData,
      "workspaceId",
    );


  const memberId =
    formValue(
      formData,
      "memberId",
    );


  await requireWorkspacePermission(
    workspaceId,
    user.id,
    "OWNER",
  );


  await prisma.workspaceMember.deleteMany({
    where: {
      id:
        memberId,

      workspaceId,
    },
  });


  revalidatePath(
    `/workspaces/${workspaceId}`,
  );
}


export async function revokeWorkspaceInvitationAction(
  formData:
    FormData,
): Promise<void> {
  const user =
    await requireCurrentUserIdentity();


  const workspaceId =
    formValue(
      formData,
      "workspaceId",
    );


  const invitationId =
    formValue(
      formData,
      "invitationId",
    );


  await requireWorkspacePermission(
    workspaceId,
    user.id,
    "OWNER",
  );


  await prisma.workspaceInvitation.deleteMany({
    where: {
      id:
        invitationId,

      workspaceId,

      acceptedAt:
        null,
    },
  });


  revalidatePath(
    `/workspaces/${workspaceId}`,
  );
}


export async function assignProjectToWorkspaceAction(
  formData:
    FormData,
): Promise<void> {
  const user =
    await requireCurrentUserIdentity();


  const workspaceId =
    formValue(
      formData,
      "workspaceId",
    );


  const projectId =
    formValue(
      formData,
      "projectId",
    );


  await requireWorkspacePermission(
    workspaceId,
    user.id,
    "EDITOR",
  );


  const project =
    await prisma.project.findFirst({
      where: {
        id:
          projectId,

        userId:
          user.id,
      },

      select: {
        id:
          true,
      },
    });


  if (
    !project
  ) {
    redirect(
      `/workspaces/${workspaceId}?status=project-not-owned`,
    );
  }


  await prisma.project.update({
    where: {
      id:
        projectId,
    },

    data: {
      workspaceId,
    },
  });


  revalidatePath(
    `/workspaces/${workspaceId}`,
  );


  revalidatePath(
    `/projects/${projectId}`,
  );
}


export async function removeProjectFromWorkspaceAction(
  formData:
    FormData,
): Promise<void> {
  const user =
    await requireCurrentUserIdentity();


  const projectId =
    formValue(
      formData,
      "projectId",
    );


  const project =
    await prisma.project.findFirst({
      where: {
        id:
          projectId,

        userId:
          user.id,
      },

      select: {
        workspaceId:
          true,
      },
    });


  if (
    !project
  ) {
    redirect(
      "/workspaces?status=project-not-owned",
    );
  }


  await prisma.project.update({
    where: {
      id:
        projectId,
    },

    data: {
      workspaceId:
        null,
    },
  });


  revalidatePath(
    "/workspaces",
  );


  revalidatePath(
    `/projects/${projectId}`,
  );
}


export async function deleteWorkspaceAction(
  formData:
    FormData,
): Promise<void> {
  const user =
    await requireCurrentUserIdentity();


  const workspaceId =
    formValue(
      formData,
      "workspaceId",
    );


  await requireWorkspacePermission(
    workspaceId,
    user.id,
    "OWNER",
  );


  await prisma.$transaction([
    prisma.project.updateMany({
      where: {
        workspaceId,
      },

      data: {
        workspaceId:
          null,
      },
    }),

    prisma.workspace.delete({
      where: {
        id:
          workspaceId,
      },
    }),
  ]);


  redirect(
    "/workspaces",
  );
}
