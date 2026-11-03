export type PasswordCheck = {
  id: "length" | "case" | "number";
  label: string;
  met: boolean;
};

/**
 * Live checklist shown while a person types a new password.
 * It mirrors the registration rules in lib/validation/auth.ts;
 * the server remains the only authority.
 */
export function getRegistrationPasswordChecks(password: string): PasswordCheck[] {
  return [
    {
      id: "length",
      label: "At least 8 characters",
      met: password.length >= 8,
    },

    {
      id: "case",
      label: "Uppercase and lowercase letters",
      met: /[a-z]/.test(password) && /[A-Z]/.test(password),
    },

    {
      id: "number",
      label: "A number",
      met: /[0-9]/.test(password),
    },
  ];
}

export function passwordMeetsRegistrationRules(password: string): boolean {
  return getRegistrationPasswordChecks(password).every((check) => check.met);
}
