import { describe, expect, it } from "vitest";

import {
  getRegistrationPasswordChecks,
  passwordMeetsRegistrationRules,
} from "@/lib/auth/password-checks";
import { registerSchema } from "@/lib/validation/auth";

function serverAccepts(password: string): boolean {
  return registerSchema.safeParse({
    name: "Test User",

    email: "test.user@example.com",

    password,

    confirmPassword: password,
  }).success;
}

describe("registration password checklist", () => {
  it("lists the three registration rules in a stable order", () => {
    expect(getRegistrationPasswordChecks("").map((check) => check.id)).toEqual([
      "length",
      "case",
      "number",
    ]);
  });

  it("marks only the satisfied rules", () => {
    const checks = getRegistrationPasswordChecks("abcdefgh");

    expect(checks.find((check) => check.id === "length")?.met).toBe(true);

    expect(checks.find((check) => check.id === "case")?.met).toBe(false);

    expect(checks.find((check) => check.id === "number")?.met).toBe(false);
  });

  it("agrees with the server-side registration schema", () => {
    const samples = [
      "",
      "Abc1",
      "abcdefg1",
      "ABCDEFG1",
      "Abcdefgh",
      "Abcdefg1",
      "VentureScope-E2E-2026",
      "12345678",
      "Passw0rd",
    ];

    for (const sample of samples) {
      expect(passwordMeetsRegistrationRules(sample), sample).toBe(serverAccepts(sample));
    }
  });
});
