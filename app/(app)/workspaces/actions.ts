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
  hashInvitationToken,
  normalizeInvitationEmail,
} from "@/lib/workspaces/invitations";

import {
  createInvitationLink,
} from "@/lib/workspaces/invitation-links";

import {
  getWorkspacePermission,
  requireWorkspacePermission,
} from "@/lib/workspaces/access";

import {
  sharingReturnPath,
} from "@/lib/workspaces/model-sharing";

import {
  memberRemovedStatus,
  projectRemovedStatus,
} from "@/lib/workspaces/people";


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
    `/workspaces/${workspace.id}?status=workspace-created`,
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


  const alreadyMember =
    await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,

        user: {
          email,
        },
      },

      select: {
        id:
          true,
      },
    });


  if (
    alreadyMember
  ) {
    redirect(
      `/workspaces/${workspaceId}?status=already-member`,
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
    await createInvitationLink({
      workspaceId,

      email,

      role,

      createdByUserId:
        user.id,
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


  // A person who is already inside keeps their role. An older link must not change it.
  const permission =
    await getWorkspacePermission(
      invitation.workspaceId,
      user.id,
    );


  if (
    permission !== null
  ) {
    redirect(
      `/workspaces/${invitation.workspaceId}?status=already-joined`,
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

    prisma.workspaceInvitation.deleteMany({
      where: {
        workspaceId:
          invitation.workspaceId,

        emailNormalized:
          invitation.emailNormalized,

        acceptedAt:
          null,

        id: {
          not:
            invitation.id,
        },
      },
    }),
  ]);


  redirect(
    `/workspaces/${invitation.workspaceId}?status=joined`,
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


  redirect(
    `/workspaces/${workspaceId}?status=role-updated`,
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


  const member = await prisma.workspaceMember.findFirst({
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
    redirect(`/workspaces/${workspaceId}?status=member-removed`);
  }

  // The models this person shared become private again, then the membership ends.
  const [released] = await prisma.$transaction([
    prisma.project.updateMany({
      where: {
        workspaceId,

        userId: member.userId,
      },

      data: {
        workspaceId: null,
      },
    }),

    prisma.workspaceMember.deleteMany({
      where: {
        id: member.id,

        workspaceId,
      },
    }),
  ]);

  revalidatePath("/workspaces");

  revalidatePath(`/workspaces/${workspaceId}`);

  redirect(`/workspaces/${workspaceId}?status=${memberRemovedStatus(released.count)}`);
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


  redirect(
    `/workspaces/${workspaceId}?status=invitation-revoked`,
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
    "layout",
  );


  redirect(
    sharingReturnPath({
      from:
        formValue(
          formData,
          "from",
        ),

      isModelOwner:
        true,

      projectId,

      workspaceId,

      status:
        "project-shared",
    }),
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

        // The person who owns the model, or the owner of the workspace it is in.
        OR: [
          {
            userId:
              user.id,
          },

          {
            workspace: {
              is: {
                ownerId:
                  user.id,
              },
            },
          },
        ],
      },

      select: {
        workspaceId:
          true,

        userId:
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
    "layout",
  );


  const status = projectRemovedStatus(user.id, project.userId);

  redirect(
    sharingReturnPath({
      from: formValue(formData, "from"),
      isModelOwner: project.userId === user.id,
      projectId,
      workspaceId: project.workspaceId,
      status,
    }),
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
    "/workspaces?status=workspace-deleted",
  );
}
