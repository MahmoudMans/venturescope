"use server";

import { hash } from "bcryptjs";
import { redirect } from "next/navigation";

import { recoveryKeyMatches } from "@/lib/auth/recovery-key";
import { validateRecoveryReset } from "@/lib/auth/recovery-reset";
import type { RecoveryResetState } from "@/lib/auth/recovery-state";
import { authPageHref } from "@/lib/auth/return-path";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { logRecoveryEvent } from "@/lib/security/recovery-events";

const ATTEMPT_LIMIT = 8;

const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

// The same words for an unknown email and a wrong key, so nobody can use this
// form to find out which email addresses have an account.
const MISMATCH_MESSAGE = "The email and recovery key do not match. Check both and try again.";

function text(formData: FormData, key: string): string {
  const candidate = formData.get(key);

  return typeof candidate === "string" ? candidate : "";
}

export async function resetPasswordAction(
  _previousState: RecoveryResetState,
  formData: FormData,
): Promise<RecoveryResetState> {
  const checked = validateRecoveryReset({
    email: text(formData, "email"),
    recoveryKey: text(formData, "recoveryKey"),
    newPassword: text(formData, "newPassword"),
    confirmPassword: text(formData, "confirmPassword"),
  });

  if (checked.ok === false) {
    return {
      message: "Please correct the highlighted fields.",
      errors: checked.errors,
    };
  }

  const secret = process.env.AUTH_SECRET;

  if (secret === undefined || secret === "") {
    return {
      message: "Password recovery is not available right now. Please try again later.",
    };
  }

  const attempts = checkRateLimit({
    key: `recovery-reset:${checked.data.email}`,
    limit: ATTEMPT_LIMIT,
    windowMs: ATTEMPT_WINDOW_MS,
  });

  if (attempts.allowed === false) {
    const minutes = Math.max(1, Math.ceil(attempts.retryAfterSeconds / 60));

    return {
      message: `Too many attempts. Try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`,
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      email: checked.data.email,
    },

    select: {
      id: true,
      passwordHash: true,
    },
  });

  // Also run the check for an unknown email, so both cases take about the same time.
  const keyMatches = recoveryKeyMatches(
    secret,
    user?.id ?? "unknown-user",
    user?.passwordHash ?? "unknown-hash",
    checked.data.recoveryKey,
  );

  if (user === null || keyMatches === false) {
    logRecoveryEvent("password.reset.rejected", user?.id ?? "unknown", {
      reason: user === null ? "unknown-email" : "wrong-key",
    });

    return {
      message: MISMATCH_MESSAGE,
    };
  }

  const passwordHash = await hash(checked.data.newPassword, 12);

  // The password hash is part of the key. Matching on it here means a key that was
  // just used (or a password that just changed) cannot be used a second time.
  const updated = await prisma.user.updateMany({
    where: {
      id: user.id,
      passwordHash: user.passwordHash,
    },

    data: {
      passwordHash,

      authVersion: {
        increment: 1,
      },

      passwordChangedAt: new Date(),
    },
  });

  if (updated.count !== 1) {
    return {
      message: MISMATCH_MESSAGE,
    };
  }

  logRecoveryEvent("password.reset", user.id);

  // The sign-in page keeps the page the person wanted, for example an invitation.
  redirect(authPageHref("/login", { security: "password-reset", next: text(formData, "next") }));
}
