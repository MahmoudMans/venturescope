import { z } from "zod";

import { validatePasswordPolicy } from "@/lib/auth/password-policy";
import { RECOVERY_KEY_LENGTH, normalizeRecoveryKey } from "@/lib/auth/recovery-key";

export type RecoveryResetField = "email" | "recoveryKey" | "newPassword" | "confirmPassword";

export type RecoveryResetInput = Record<RecoveryResetField, string>;

export type RecoveryResetErrors = Partial<Record<RecoveryResetField, string[]>>;

export type RecoveryResetResult =
  | {
      ok: true;
      data: { email: string; recoveryKey: string; newPassword: string };
    }
  | {
      ok: false;
      errors: RecoveryResetErrors;
    };

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Enter a valid email address.");

/**
 * Checks the "forgot password" form before the server looks at the database.
 * The new password follows the same rules as the change-password form.
 */
export function validateRecoveryReset(input: RecoveryResetInput): RecoveryResetResult {
  const errors: RecoveryResetErrors = {};

  const email = emailSchema.safeParse(input.email);

  if (email.success === false) {
    errors.email = [email.error.issues[0]?.message ?? "Enter a valid email address."];
  }

  const recoveryKey = normalizeRecoveryKey(input.recoveryKey);

  if (recoveryKey.length === 0) {
    errors.recoveryKey = ["Recovery key is required."];
  } else if (recoveryKey.length !== RECOVERY_KEY_LENGTH) {
    errors.recoveryKey = [`The recovery key has ${RECOVERY_KEY_LENGTH} characters.`];
  }

  const policy = validatePasswordPolicy(input.newPassword);

  if (policy.valid === false) {
    errors.newPassword = policy.issues;
  }

  if (input.confirmPassword !== input.newPassword) {
    errors.confirmPassword = ["Passwords do not match."];
  }

  if (email.success === false || Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      email: email.data.toLowerCase(),
      recoveryKey,
      newPassword: input.newPassword,
    },
  };
}
