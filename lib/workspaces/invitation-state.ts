import { formatCount, formatInvitationExpiry } from "@/lib/workspaces/labels";

/** An invitation link works for this many days. `invitationExpiry` uses the same number. */
export const INVITATION_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

export type InvitationStatus = "pending" | "expired";

/** A link that was not accepted is pending until the moment it expires. */
export function invitationStatus(expiresAt: Date, now: Date): InvitationStatus {
  return expiresAt.getTime() > now.getTime() ? "pending" : "expired";
}

/**
 * "Expires Oct 23, 2026 (5 days left)" or "Expired on Oct 10, 2026". Dates are in UTC.
 * A day that has started counts as a day, so a link made a moment ago says "7 days left".
 */
export function describeInvitationTiming(expiresAt: Date, now: Date): string {
  const date = formatInvitationExpiry(expiresAt);

  const left = expiresAt.getTime() - now.getTime();

  if (left <= 0) {
    return `Expired on ${date}`;
  }

  if (left < DAY_MS) {
    return `Expires ${date} (less than 1 day left)`;
  }

  return `Expires ${date} (${formatCount(Math.ceil(left / DAY_MS), "day")} left)`;
}

/** Links that still work come first, then the expired ones. The newest link is first in each group. */
export function sortInvitations<T extends { expiresAt: Date; createdAt: Date }>(
  invitations: ReadonlyArray<T>,
  now: Date,
): T[] {
  return [...invitations].sort((left, right) => {
    const leftOrder = invitationStatus(left.expiresAt, now) === "pending" ? 0 : 1;

    const rightOrder = invitationStatus(right.expiresAt, now) === "pending" ? 0 : 1;

    return (
      leftOrder - rightOrder ||
      right.createdAt.getTime() - left.createdAt.getTime() ||
      right.expiresAt.getTime() - left.expiresAt.getTime()
    );
  });
}

/** Only editors and viewers are invited. Anything else becomes a viewer, the safest role. */
export function toInvitationRole(value: string): "EDITOR" | "VIEWER" {
  return value === "EDITOR" ? "EDITOR" : "VIEWER";
}

/** The question in the dialog of the "New link" button. */
export function describeRenewDialog(
  email: string,
  status: InvitationStatus,
): { title: string; description: string } {
  return {
    title: `Create a new link for ${email}?`,

    description:
      status === "pending"
        ? `The link you made before stops working at once. Send the new link to ${email}. It works for ${INVITATION_DAYS} days.`
        : `The old link has expired. The new link works for ${INVITATION_DAYS} days. Send it to ${email}.`,
  };
}

/** What the invitation page shows to the person who opened the link. */
export type InvitationView =
  | { kind: "missing" }
  | { kind: "joined" }
  | { kind: "expired"; expiredOn: string }
  | { kind: "open" };

/**
 * Decides which page a link opens.
 *
 * - The right person who is already in the workspace goes to the workspace.
 * - The right person with a link that expired is told so, with the date.
 * - Everybody else who cannot use the link gets the same "does not work" page, so the page does
 *   not tell a stranger whether a link was used, expired or replaced.
 */
export function viewInvitation(input: {
  acceptedAt: Date | null;

  expiresAt: Date;

  emailMatches: boolean;

  personIsInside: boolean;

  now: Date;
}): InvitationView {
  if (input.emailMatches && input.personIsInside) {
    return { kind: "joined" };
  }

  if (input.acceptedAt !== null) {
    return { kind: "missing" };
  }

  if (invitationStatus(input.expiresAt, input.now) === "expired") {
    return input.emailMatches
      ? { kind: "expired", expiredOn: formatInvitationExpiry(input.expiresAt) }
      : { kind: "missing" };
  }

  return { kind: "open" };
}

/** "Amira Ben", or "the workspace owner" when the person who invited has no name. */
export function inviterLabel(name: string | null | undefined): string {
  const trimmed = name?.trim() ?? "";

  return trimmed === "" ? "the workspace owner" : trimmed;
}
