"use server";

import { compare } from "bcryptjs";

import { deriveRecoveryKey, formatRecoveryKey } from "@/lib/auth/recovery-key";
import type { RecoveryKeyRevealState } from "@/lib/auth/recovery-state";
import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { logRecoveryEvent } from "@/lib/security/recovery-events";

const ATTEMPT_LIMIT = 10;

const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

export async function revealRecoveryKeyAction(
  _previousState: RecoveryKeyRevealState,
  formData: FormData,
): Promise<RecoveryKeyRevealState> {
  const user = await requireUser();

  const candidate = formData.get("password");

  const password = typeof candidate === "string" ? candidate : "";

  if (password.length === 0) {
    return {
      message: "Enter your password to show the recovery key.",
    };
  }

  const secret = process.env.AUTH_SECRET;

  if (secret === undefined || secret === "") {
    return {
      message: "The recovery key is not available right now. Please try again later.",
    };
  }

  const attempts = checkRateLimit({
    key: `recovery-reveal:${user.id}`,
    limit: ATTEMPT_LIMIT,
    windowMs: ATTEMPT_WINDOW_MS,
  });

  if (attempts.allowed === false) {
    const minutes = Math.max(1, Math.ceil(attempts.retryAfterSeconds / 60));

    return {
      message: `Too many attempts. Try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`,
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

  const passwordMatches = await compare(password, account.passwordHash);

  if (passwordMatches === false) {
    logRecoveryEvent("recovery-key.reveal.rejected", user.id);

    return {
      message: "That password is not correct.",
    };
  }

  logRecoveryEvent("recovery-key.revealed", user.id);

  return {
    recoveryKey: formatRecoveryKey(deriveRecoveryKey(secret, user.id, account.passwordHash)),
  };
}
