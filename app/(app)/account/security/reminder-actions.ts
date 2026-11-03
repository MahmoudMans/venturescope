"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import {
  recoveryReminderCookieName,
  recoveryReminderCookieOptions,
  recoveryReminderToken,
} from "@/lib/auth/recovery-reminder";
import type { RecoveryAckState } from "@/lib/auth/recovery-state";
import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db/prisma";

/**
 * The person says "I saved my recovery key". The answer is remembered on this device only, and
 * only until the password changes. Nothing is stored in the database.
 */
export async function acknowledgeRecoveryKeyAction(): Promise<RecoveryAckState> {
  const user = await requireUser();

  const secret = process.env.AUTH_SECRET;

  if (secret === undefined || secret === "") {
    return {
      message: "The recovery key is not available right now. Please try again later.",
    };
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
    return {
      message: "Your account could not be found. Please sign in again.",
    };
  }

  const store = await cookies();

  store.set(
    recoveryReminderCookieName(user.id),
    recoveryReminderToken(secret, user.id, account.passwordHash),
    recoveryReminderCookieOptions(process.env.AUTH_URL),
  );

  revalidatePath("/dashboard");

  return {
    saved: true,
  };
}
