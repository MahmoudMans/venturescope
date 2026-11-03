import { describe, expect, it } from "vitest";

import { getLoginNotice } from "@/lib/auth/login-notices";

describe("login notices", () => {
  it("explains each security redirect", () => {
    expect(getLoginNotice("password-changed")?.title).toBe("Password updated");

    expect(getLoginNotice("sessions-revoked")?.title).toBe("Signed out everywhere");

    expect(getLoginNotice("account-deleted")?.tone).toBe("info");
  });

  it("tells people about the recovery key at the right moments", () => {
    expect(getLoginNotice("password-changed")?.message).toContain("recovery key changed too");

    expect(getLoginNotice("password-reset")?.message).toContain("recovery key changed too");

    expect(getLoginNotice("account-created")?.message).toContain("recovery key");
  });

  it("ignores missing, repeated and unknown codes", () => {
    expect(getLoginNotice(undefined)).toBe(null);

    expect(getLoginNotice(["password-changed", "password-changed"])).toBe(null);

    expect(getLoginNotice("something-else")).toBe(null);

    expect(getLoginNotice("")).toBe(null);
  });

  it("does not treat object prototype keys as notices", () => {
    expect(getLoginNotice("constructor")).toBe(null);

    expect(getLoginNotice("__proto__")).toBe(null);

    expect(getLoginNotice("toString")).toBe(null);
  });
});
