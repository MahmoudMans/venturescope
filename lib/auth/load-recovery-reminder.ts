import { cookies } from "next/headers";

import {
  isRecoveryReminderAcknowledged,
  recoveryReminderCookieName,
  type RecoveryKeyStatus,
} from "@/lib/auth/recovery-reminder";
import { prisma } from "@/lib/db/prisma";

/**
 * What the app knows about the recovery key of this person on this device: they said "I saved it"
 * since their password was last set ("saved"), they did not ("not-saved"), or there is no key to
 * talk about ("unavailable").
 */
export async function loadRecoveryKeyStatus(userId: string): Promise<RecoveryKeyStatus> {
  const secret = process.env.AUTH_SECRET;

  // Without the server secret there is no recovery key, so there is nothing to remind about.
  if (secret === undefined || secret === "") {
    return "unavailable";
  }

  const account = await prisma.user.findUnique({
    where: {
      id: userId,
    },

    select: {
      passwordHash: true,
    },
  });

  if (account === null) {
    return "unavailable";
  }

  const store = await cookies();

  const saved = store.get(recoveryReminderCookieName(userId))?.value;

  return isRecoveryReminderAcknowledged(secret, userId, account.passwordHash, saved)
    ? "saved"
    : "not-saved";
}

/** True when the dashboard should remind this person to save the recovery key. */
export async function shouldShowRecoveryReminder(userId: string): Promise<boolean> {
  return (await loadRecoveryKeyStatus(userId)) === "not-saved";
}
