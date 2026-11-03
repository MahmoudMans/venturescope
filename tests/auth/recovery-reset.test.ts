import { describe, expect, it } from "vitest";

import { validateRecoveryReset } from "@/lib/auth/recovery-reset";

const VALID = {
  email: "Founder@Example.com ",
  recoveryKey: "0297-wff2-vbke-nxfg-jsn8-zww7",
  newPassword: "Correct-Horse-9",
  confirmPassword: "Correct-Horse-9",
};

describe("validateRecoveryReset", () => {
  it("accepts a complete form and cleans up the values", () => {
    const result = validateRecoveryReset(VALID);

    expect(result).toEqual({
      ok: true,
      data: {
        email: "founder@example.com",
        recoveryKey: "0297WFF2VBKENXFGJSN8ZWW7",
        newPassword: "Correct-Horse-9",
      },
    });
  });

  it("asks for every field", () => {
    const result = validateRecoveryReset({
      email: "",
      recoveryKey: "",
      newPassword: "",
      confirmPassword: "",
    });

    expect(result.ok).toBe(false);

    if (result.ok === false) {
      expect(result.errors.email?.[0]).toBe("Email is required.");

      expect(result.errors.recoveryKey?.[0]).toBe("Recovery key is required.");

      expect(result.errors.newPassword?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("rejects an email that is not an email", () => {
    const result = validateRecoveryReset({ ...VALID, email: "not-an-email" });

    expect(result.ok).toBe(false);

    if (result.ok === false) {
      expect(result.errors.email?.[0]).toBe("Enter a valid email address.");

      expect(result.errors.recoveryKey).toBeUndefined();
    }
  });

  it("tells the person when the recovery key is too short or too long", () => {
    for (const recoveryKey of ["0297-WFF2", `${VALID.recoveryKey}-0000`]) {
      const result = validateRecoveryReset({ ...VALID, recoveryKey });

      expect(result.ok).toBe(false);

      if (result.ok === false) {
        expect(result.errors.recoveryKey?.[0]).toBe("The recovery key has 24 characters.");
      }
    }
  });

  it("applies the same password rules as the change-password form", () => {
    const weak = validateRecoveryReset({
      ...VALID,
      newPassword: "short",
      confirmPassword: "short",
    });

    expect(weak.ok).toBe(false);

    if (weak.ok === false) {
      expect(weak.errors.newPassword).toContain("Use at least 12 characters.");

      expect(weak.errors.newPassword).toContain("Include a symbol.");
    }
  });

  it("needs the confirmation to match", () => {
    const result = validateRecoveryReset({ ...VALID, confirmPassword: "Correct-Horse-8" });

    expect(result.ok).toBe(false);

    if (result.ok === false) {
      expect(result.errors.confirmPassword).toEqual(["Passwords do not match."]);

      expect(result.errors.newPassword).toBeUndefined();
    }
  });

  it("reports several problems at once", () => {
    const result = validateRecoveryReset({
      email: "nope",
      recoveryKey: "abc",
      newPassword: "short",
      confirmPassword: "other",
    });

    expect(result.ok).toBe(false);

    if (result.ok === false) {
      expect(Object.keys(result.errors).sort()).toEqual([
        "confirmPassword",
        "email",
        "newPassword",
        "recoveryKey",
      ]);
    }
  });
});
