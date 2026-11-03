import { formatMemberSince } from "@/lib/account/profile";
import type { RecoveryKeyStatus } from "@/lib/auth/recovery-reminder";

/**
 * The "Security check-up" on the Security page: a few plain facts about the account, each one
 * marked as done, as something to look at, or as good to know. Everything here is calculated
 * from data the app already has, so nothing is stored for it.
 */

export type CheckupTone = "good" | "attention" | "info";

export type CheckupItem = {
  id: "password" | "recovery-key" | "email";

  tone: CheckupTone;

  title: string;

  detail: string;

  /** A button that takes the person to the right place on the Security page, or nothing. */
  action: { label: string; href: string } | null;
};

/** A password that is older than this many days gets a gentle hint to choose a new one. */
export const PASSWORD_REVIEW_DAYS = 365;

const DAY_MS = 24 * 60 * 60 * 1000;

export function buildSecurityCheckup(input: {
  now: Date;

  createdAt: Date;

  passwordChangedAt: Date | null;

  recoveryKey: RecoveryKeyStatus;

  email: string;
}): CheckupItem[] {
  return [
    passwordItem(input.now, input.createdAt, input.passwordChangedAt),
    recoveryKeyItem(input.recoveryKey),
    emailItem(input.email),
  ];
}

function passwordItem(now: Date, createdAt: Date, passwordChangedAt: Date | null): CheckupItem {
  const since = passwordChangedAt ?? createdAt;

  const date = formatMemberSince(since);

  const lead =
    passwordChangedAt === null
      ? `You chose it when you created your account on ${date}.`
      : `Last changed on ${date}.`;

  if (now.getTime() - since.getTime() < PASSWORD_REVIEW_DAYS * DAY_MS) {
    return {
      id: "password",
      tone: "good",
      title: "Password",
      detail: lead,
      action: null,
    };
  }

  return {
    id: "password",
    tone: "attention",
    title: "Password",
    detail: `${lead} That was more than a year ago. If you use this password anywhere else, choose a new one.`,
    action: { label: "Change password", href: "/account/security#password" },
  };
}

function recoveryKeyItem(status: RecoveryKeyStatus): CheckupItem {
  if (status === "saved") {
    return {
      id: "recovery-key",
      tone: "good",
      title: "Recovery key",
      detail:
        "You said that you saved it. VentureScope will not remind you on this device until your password changes.",
      action: null,
    };
  }

  if (status === "not-saved") {
    return {
      id: "recovery-key",
      tone: "attention",
      title: "Recovery key",
      detail:
        "You have not said that you saved it on this device. Without it, a forgotten password cannot be reset.",
      action: { label: "Show my recovery key", href: "/account/security#recovery-key" },
    };
  }

  return {
    id: "recovery-key",
    tone: "info",
    title: "Recovery key",
    detail: "The recovery key is not available right now. Please try again later.",
    action: null,
  };
}

function emailItem(email: string): CheckupItem {
  return {
    id: "email",
    tone: "info",
    title: "Email address",
    detail: `You sign in as ${email}. VentureScope sends no emails, so it cannot check that the address is yours. Workspace invitations are matched to it.`,
    action: { label: "Change email", href: "/account/security#email" },
  };
}

/** How many items ask the person to do something. */
export function countAttention(items: CheckupItem[]): number {
  return items.filter((item) => item.tone === "attention").length;
}

/** The small badge in the corner of the card. */
export function describeCheckupSummary(items: CheckupItem[]): {
  tone: "success" | "warning";
  label: string;
} {
  const count = countAttention(items);

  if (count === 0) {
    return { tone: "success", label: "All good" };
  }

  return { tone: "warning", label: count === 1 ? "1 thing to check" : `${count} things to check` };
}
