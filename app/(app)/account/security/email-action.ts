"use server";

import { compare } from "bcryptjs";
import { redirect } from "next/navigation";

import { signOut } from "@/auth";
import {
  EMAIL_CHANGE_LIMIT,
  EMAIL_CHANGE_WINDOW_MS,
  isUniqueViolation,
  normalizeNewEmail,
} from "@/lib/account/email-change";
import { requireCurrentUserIdentity } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { logAccountSecurityEvent } from "@/lib/security/account-events";
import { checkRateLimit } from "@/lib/security/rate-limit";

function field(formData: FormData, key: string): string {
  const candidate = formData.get(key);

  return typeof candidate === "string" ? candidate : "";
}

/** Sends the person back to the Security page. Only a fixed code goes into the address. */
function back(status: string): never {
  redirect(`/account/security?status=${status}`);
}

/**
 * Changes the email address that the person signs in with. It needs the current
 * password, and the new address twice, because no email is sent to check it.
 * Every session is signed out afterwards, so the person signs in again with the
 * new address. The log never contains an email address.
 */
export async function changeEmailAction(formData: FormData): Promise<void> {
  const user = await requireCurrentUserIdentity();

  const attempts = checkRateLimit({
    key: `email-change:${user.id}`,

    limit: EMAIL_CHANGE_LIMIT,

    windowMs: EMAIL_CHANGE_WINDOW_MS,
  });

  if (attempts.allowed === false) {
    logAccountSecurityEvent("email.change.rejected", user.id, {
      reason: "rate-limit",
    });

    back("email-rate-limit");
  }

  const next = normalizeNewEmail(field(formData, "newEmail"));

  if (next.ok === false) {
    back("email-invalid");
  }

  const again = normalizeNewEmail(field(formData, "confirmEmail"));

  if (again.ok === false || again.email !== next.email) {
    back("email-mismatch");
  }

  const account = await prisma.user.findUnique({
    where: {
      id: user.id,
    },

    select: {
      email: true,

      passwordHash: true,
    },
  });

  if (account === null) {
    redirect("/login");
  }

  const passwordMatches = await compare(field(formData, "password"), account.passwordHash);

  if (passwordMatches === false) {
    logAccountSecurityEvent("email.change.rejected", user.id, {
      reason: "password",
    });

    back("email-password");
  }

  if (next.email === account.email.trim().toLowerCase()) {
    back("email-same");
  }

  const taken = await prisma.user.findUnique({
    where: {
      email: next.email,
    },

    select: {
      id: true,
    },
  });

  if (taken !== null) {
    logAccountSecurityEvent("email.change.rejected", user.id, {
      reason: "taken",
    });

    back("email-taken");
  }

  try {
    await prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        email: next.email,

        authVersion: {
          increment: 1,
        },
      },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      logAccountSecurityEvent("email.change.rejected", user.id, {
        reason: "taken",
      });

      back("email-taken");
    }

    throw error;
  }

  logAccountSecurityEvent("email.changed", user.id);

  await signOut({
    redirectTo: "/login?security=email-changed",
  });
}
