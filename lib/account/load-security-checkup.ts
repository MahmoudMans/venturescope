import { buildSecurityCheckup, type CheckupItem } from "@/lib/account/security-checkup";
import { loadRecoveryKeyStatus } from "@/lib/auth/load-recovery-reminder";
import { prisma } from "@/lib/db/prisma";

/** The check-up items for one account, or null when the account cannot be found. */
export async function loadSecurityCheckup(userId: string): Promise<CheckupItem[] | null> {
  if (userId === "") {
    return null;
  }

  const account = await prisma.user.findUnique({
    where: {
      id: userId,
    },

    select: {
      email: true,

      createdAt: true,

      passwordChangedAt: true,
    },
  });

  if (account === null) {
    return null;
  }

  return buildSecurityCheckup({
    now: new Date(),

    createdAt: account.createdAt,

    passwordChangedAt: account.passwordChangedAt,

    recoveryKey: await loadRecoveryKeyStatus(userId),

    email: account.email,
  });
}
