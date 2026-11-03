import { z } from "zod";

const emailSchema = z.string().trim().email();

/** Returns a clean email address, or null when the value is missing or not an email. */
export function parseSupportEmail(raw: string | undefined): string | null {
  if (raw === undefined) {
    return null;
  }

  const parsed = emailSchema.safeParse(raw);

  return parsed.success ? parsed.data : null;
}

/**
 * The address shown on the Help, Privacy and Terms pages. It is optional.
 * Set NEXT_PUBLIC_SUPPORT_EMAIL before you build the app.
 */
export function getSupportEmail(): string | null {
  return parseSupportEmail(process.env.NEXT_PUBLIC_SUPPORT_EMAIL);
}
