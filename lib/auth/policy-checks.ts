import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/auth/password-policy";

export type AccountPasswordCheck = {
  id: "length" | "lowercase" | "uppercase" | "number" | "symbol" | "repeat";
  label: string;
  met: boolean;
};

/**
 * Live checklist for the change-password form. It mirrors validatePasswordPolicy
 * in lib/auth/password-policy.ts; the server action stays the only authority.
 */
export function getAccountPasswordChecks(password: string): AccountPasswordCheck[] {
  return [
    {
      id: "length",
      label: `${PASSWORD_MIN_LENGTH} to ${PASSWORD_MAX_LENGTH} characters`,
      met: password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH,
    },

    {
      id: "lowercase",
      label: "A lowercase letter",
      met: /[a-z]/.test(password),
    },

    {
      id: "uppercase",
      label: "An uppercase letter",
      met: /[A-Z]/.test(password),
    },

    {
      id: "number",
      label: "A number",
      met: /[0-9]/.test(password),
    },

    {
      id: "symbol",
      label: "A symbol, such as - or _",
      met: /[^A-Za-z0-9]/.test(password),
    },

    {
      id: "repeat",
      label: "No character repeated four times in a row",
      met: password.length > 0 && /(.)\1{3,}/.test(password) === false,
    },
  ];
}

export function passwordMeetsAccountPolicy(password: string): boolean {
  return getAccountPasswordChecks(password).every((check) => check.met);
}
