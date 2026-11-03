"use server";

import {
  compare,
  hash,
} from "bcryptjs";

import {
  redirect,
} from "next/navigation";

import {
  auth,
  signOut,
} from "@/auth";

import {
  prisma,
} from "@/lib/db/prisma";

import {
  validatePasswordPolicy,
} from "@/lib/auth/password-policy";

import {
  logAccountSecurityEvent,
} from "@/lib/security/account-events";


async function requireCurrentUserId(): Promise<string> {
  const session =
    await auth();


  const directId =
    (
      session?.user as
        | {
            id?:
              string;
          }
        | undefined
    )?.id;


  if (
    directId
  ) {
    return directId;
  }


  const email =
    session?.user
      ?.email;


  if (
    !email
  ) {
    redirect(
      "/login",
    );
  }


  const user =
    await prisma.user.findUnique({
      where: {
        email,
      },

      select: {
        id:
          true,
      },
    });


  if (
    !user
  ) {
    redirect(
      "/login",
    );
  }


  return user.id;
}


function value(
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
        candidate
      :
        ""
  );
}


export async function changePasswordAction(
  formData:
    FormData,
): Promise<void> {
  const userId =
    await requireCurrentUserId();


  const currentPassword =
    value(
      formData,
      "currentPassword",
    );


  const newPassword =
    value(
      formData,
      "newPassword",
    );


  const confirmPassword =
    value(
      formData,
      "confirmPassword",
    );


  if (
    newPassword !==
    confirmPassword
  ) {
    redirect(
      "/account/security?status=password-mismatch",
    );
  }


  const policy =
    validatePasswordPolicy(
      newPassword,
    );


  if (
    !policy.valid
  ) {
    logAccountSecurityEvent(
      "password.change.rejected",
      userId,
      {
        reason:
          "policy",
      },
    );


    redirect(
      "/account/security?status=password-policy",
    );
  }


  const user =
    await prisma.user.findUnique({
      where: {
        id:
          userId,
      },

      select: {
        passwordHash:
          true,
      },
    });


  if (
    !user
  ) {
    redirect(
      "/login",
    );
  }


  const currentValid =
    await compare(
      currentPassword,
      user.passwordHash,
    );


  if (
    !currentValid
  ) {
    logAccountSecurityEvent(
      "password.change.rejected",
      userId,
      {
        reason:
          "current-password",
      },
    );


    redirect(
      "/account/security?status=wrong-password",
    );
  }


  if (
    await compare(
      newPassword,
      user.passwordHash,
    )
  ) {
    redirect(
      "/account/security?status=same-password",
    );
  }


  const passwordHash =
    await hash(
      newPassword,
      12,
    );


  await prisma.user.update({
    where: {
      id:
        userId,
    },

    data: {
      passwordHash:
        passwordHash,

      authVersion: {
        increment:
          1,
      },

      passwordChangedAt:
        new Date(),
    },
  });


  logAccountSecurityEvent(
    "password.changed",
    userId,
  );


  await signOut({
    redirectTo:
      "/login?security=password-changed",
  });
}


export async function logoutAllDevicesAction(): Promise<void> {
  const userId =
    await requireCurrentUserId();


  await prisma.user.update({
    where: {
      id:
        userId,
    },

    data: {
      authVersion: {
        increment:
          1,
      },
    },
  });


  logAccountSecurityEvent(
    "sessions.revoked",
    userId,
  );


  await signOut({
    redirectTo:
      "/login?security=sessions-revoked",
  });
}


export async function deleteAccountAction(
  formData:
    FormData,
): Promise<void> {
  const userId =
    await requireCurrentUserId();


  const password =
    value(
      formData,
      "password",
    );


  const confirmation =
    value(
      formData,
      "confirmation",
    );


  if (
    confirmation !==
    "DELETE MY ACCOUNT"
  ) {
    logAccountSecurityEvent(
      "account.delete.rejected",
      userId,
      {
        reason:
          "confirmation",
      },
    );


    redirect(
      "/account/security?status=delete-confirmation",
    );
  }


  const user =
    await prisma.user.findUnique({
      where: {
        id:
          userId,
      },

      select: {
        passwordHash:
          true,
      },
    });


  if (
    !user
  ) {
    redirect(
      "/login",
    );
  }


  const passwordValid =
    await compare(
      password,
      user.passwordHash,
    );


  if (
    !passwordValid
  ) {
    logAccountSecurityEvent(
      "account.delete.rejected",
      userId,
      {
        reason:
          "password",
      },
    );


    redirect(
      "/account/security?status=delete-password",
    );
  }


  logAccountSecurityEvent(
    "account.deleted",
    userId,
  );


  await prisma.$transaction(
    async (
      transaction,
    ) => {
      const projects =
        await transaction.project.findMany({
          where: {
            userId:
              userId,
          },

          select: {
            id:
              true,
          },
        });


      const projectIds =
        projects.map(
          (
            project,
          ) =>
            project.id,
        );


      if (
        projectIds.length >
        0
      ) {
        await transaction.monthlyOverride.deleteMany({
          where: {
            projectId: {
              in:
                projectIds,
            },
          },
        });


        await transaction.financingEvent.deleteMany({
          where: {
            projectId: {
              in:
                projectIds,
            },
          },
        });


        await transaction.scenario.deleteMany({
          where: {
            projectId: {
              in:
                projectIds,
            },
          },
        });


        await transaction.project.deleteMany({
          where: {
            userId:
              userId,
          },
        });
      }


      await transaction.user.delete({
        where: {
          id:
            userId,
        },
      });
    },
  );


  await signOut({
    redirectTo:
      "/login?security=account-deleted",
  });
}
