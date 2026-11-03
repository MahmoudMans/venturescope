import { describe, expect, it } from "vitest";

import { validatePasswordPolicy } from "@/lib/auth/password-policy";
import { getAccountPasswordChecks, passwordMeetsAccountPolicy } from "@/lib/auth/policy-checks";

describe("account password checklist", () => {
  it("lists the six policy rules in a stable order", () => {
    expect(getAccountPasswordChecks("").map((check) => check.id)).toEqual([
      "length",
      "lowercase",
      "uppercase",
      "number",
      "symbol",
      "repeat",
    ]);
  });

  it("marks nothing as met for an empty password", () => {
    expect(getAccountPasswordChecks("").some((check) => check.met)).toBe(false);
  });

  it("marks only the satisfied rules", () => {
    const checks = getAccountPasswordChecks("abcdefghijkl");

    const met = checks.filter((check) => check.met).map((check) => check.id);

    expect(met).toEqual(["length", "lowercase", "repeat"]);
  });

  it("agrees with the server-side password policy", () => {
    const samples = [
      "",
      "Short1-a",
      "alllowercase-123",
      "ALLUPPERCASE-123",
      "NoNumbersHere-x-y",
      "NoSymbols12345Abc",
      "Aaaa-bbbb-1234-Cd",
      "Good-Passphrase-2026",
      "VentureScope_2026_ok",
      "x".repeat(129) + "A1-",
      "Ab1-" + "cdef".repeat(31),
    ];

    for (const sample of samples) {
      expect(passwordMeetsAccountPolicy(sample), sample.slice(0, 24)).toBe(
        validatePasswordPolicy(sample).valid,
      );
    }
  });
});
