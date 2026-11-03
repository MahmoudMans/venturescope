import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * The reminder to save the recovery key.
 *
 * VentureScope has no table for it, so "I saved it" is kept in a small cookie on this device.
 * The cookie holds a signed value that is calculated from the server secret, the account and the
 * current password hash. That means:
 *
 * - nobody can make it up without the server secret,
 * - it belongs to one account, so two accounts in one browser do not mix,
 * - it stops matching by itself when the password changes. The recovery key changes then too, so
 *   the new key has to be saved.
 *
 * The value cannot be used for anything else: it is not the recovery key and it does not reveal it.
 */

const COOKIE_PREFIX = "vs_ra_";

const TOKEN_LABEL = "venturescope:recovery-reminder:v1";

/**
 * What the app knows about the recovery key on this device:
 * "saved" (the person said so), "not-saved", or "unavailable" (no server secret or no account).
 */
export type RecoveryKeyStatus = "saved" | "not-saved" | "unavailable";

/** The answer is remembered for one year. */
export const RECOVERY_REMINDER_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

/** A cookie name for one account. It has only letters, digits and an underscore. */
export function recoveryReminderCookieName(userId: string): string {
  return COOKIE_PREFIX + createHash("sha256").update(userId, "utf8").digest("hex").slice(0, 16);
}

/** The signed value that means "this person saved the recovery key of this password". */
export function recoveryReminderToken(
  secret: string,
  userId: string,
  passwordHash: string,
): string {
  return createHmac("sha256", secret)
    .update(`${TOKEN_LABEL}\n${userId}\n${passwordHash}`)
    .digest("base64url");
}

/** True when the cookie value is exactly the signed value for this account and password. */
export function isRecoveryReminderAcknowledged(
  secret: string,
  userId: string,
  passwordHash: string,
  cookieValue: string | undefined,
): boolean {
  if (typeof cookieValue !== "string") {
    return false;
  }

  const expected = Buffer.from(recoveryReminderToken(secret, userId, passwordHash));

  const given = Buffer.from(cookieValue);

  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** The cookie is private to the server and is only sent over https when the site uses https. */
export function recoveryReminderCookieOptions(authUrl: string | undefined) {
  return {
    httpOnly: true,

    sameSite: "lax" as const,

    secure: typeof authUrl === "string" && authUrl.startsWith("https://"),

    path: "/",

    maxAge: RECOVERY_REMINDER_MAX_AGE_SECONDS,
  };
}
