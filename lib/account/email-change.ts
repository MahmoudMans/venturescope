import { emailSchema } from "@/lib/validation/auth";

/** The longest email address that mail systems accept. */
export const EMAIL_MAX_LENGTH = 254;

/** A person can try to change the email address this many times in each time window. */
export const EMAIL_CHANGE_LIMIT = 5;

export const EMAIL_CHANGE_WINDOW_MS = 15 * 60 * 1000;

export type NewEmailResult = { ok: true; email: string } | { ok: false };

/**
 * Cleans a new email address the way sign-up does: surrounding spaces are removed,
 * the letters become lowercase, and the result must look like an email address.
 */
export function normalizeNewEmail(input: string): NewEmailResult {
  const trimmed = input.trim();

  if (trimmed.length === 0 || trimmed.length > EMAIL_MAX_LENGTH) {
    return { ok: false };
  }

  const parsed = emailSchema.safeParse(trimmed);

  return parsed.success ? { ok: true, email: parsed.data } : { ok: false };
}

/** True when the database refused a value because another row already has it. */
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "P2002"
  );
}

/**
 * The messages for the ?status= codes that the change-email action can send to
 * the Security page. A success has no message here, because the person is signed
 * out and sees a notice on the sign-in page instead.
 */
export const EMAIL_CHANGE_MESSAGES: Record<string, string> = {
  "email-invalid": "Enter a valid email address, for example name@example.com.",

  "email-mismatch": "The two email addresses are not the same. Type the new address again.",

  "email-password": "The password is not correct.",

  "email-same": "That is already your email address.",

  "email-taken": "Another account already uses that email address.",

  "email-rate-limit": "Too many tries. Please wait a few minutes and try again.",
};
