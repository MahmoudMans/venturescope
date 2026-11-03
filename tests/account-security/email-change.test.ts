import { describe, expect, it } from "vitest";

import {
  EMAIL_CHANGE_LIMIT,
  EMAIL_CHANGE_MESSAGES,
  EMAIL_CHANGE_WINDOW_MS,
  EMAIL_MAX_LENGTH,
  isUniqueViolation,
  normalizeNewEmail,
} from "@/lib/account/email-change";
import { getLoginNotice } from "@/lib/auth/login-notices";
import { deriveRecoveryKey } from "@/lib/auth/recovery-key";
import { loginSchema } from "@/lib/validation/auth";

/** An address with exactly this many characters, built from valid parts. */
function addressOfLength(total: number): string {
  const tail = ".com";

  const fixed = `${"a".repeat(64)}@${"b".repeat(63)}.${"c".repeat(63)}.`.length + tail.length;

  return `${"a".repeat(64)}@${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(total - fixed)}${tail}`;
}

describe("normalizeNewEmail", () => {
  it("removes the spaces around the address and makes the letters lowercase", () => {
    expect(normalizeNewEmail("  Amira.BenSalah@Example.COM  ")).toEqual({
      ok: true,
      email: "amira.bensalah@example.com",
    });

    expect(normalizeNewEmail("\tteam@example.com\n")).toEqual({
      ok: true,
      email: "team@example.com",
    });
  });

  it("accepts the usual shapes of an address", () => {
    for (const address of [
      "a+news@example.com",
      "first.last@sub.example.co",
      "o'neil@example.com",
      "a@b.co",
    ]) {
      expect(normalizeNewEmail(address)).toEqual({ ok: true, email: address });
    }
  });

  it("refuses text that is not an email address", () => {
    for (const text of [
      "",
      "   ",
      "amira",
      "amira@",
      "@example.com",
      "amira@example",
      "amira example@x.com",
      "amira@@example.com",
      "amira@exa mple.com",
      "a@b.c",
      "<script>@x.com",
      "a..b@example.com",
      ".a@example.com",
      "a.@example.com",
    ]) {
      expect(normalizeNewEmail(text)).toEqual({ ok: false });
    }
  });

  it("refuses an address that is longer than mail systems accept", () => {
    expect(EMAIL_MAX_LENGTH).toBe(254);

    expect(addressOfLength(254).length).toBe(254);

    expect(normalizeNewEmail(addressOfLength(254))).toEqual({
      ok: true,
      email: addressOfLength(254),
    });

    expect(addressOfLength(255).length).toBe(255);

    expect(normalizeNewEmail(addressOfLength(255))).toEqual({ ok: false });
  });

  it("does not count the spaces around the address in its length", () => {
    expect(normalizeNewEmail(`  ${addressOfLength(254)}  `)).toEqual({
      ok: true,
      email: addressOfLength(254),
    });
  });

  it("follows the same rules as signing in, so a new address can always be used to sign in", () => {
    for (const text of [
      "Amira@Example.com",
      "  spaced@example.com ",
      "no-at-sign",
      "two@@example.com",
      "x@y.z",
      "ok@example.org",
    ]) {
      const signIn = loginSchema.safeParse({ email: text, password: "x" });

      const change = normalizeNewEmail(text);

      expect(change.ok).toBe(signIn.success);

      if (change.ok && signIn.success) {
        expect(change.email).toBe(signIn.data.email);
      }
    }
  });
});

describe("isUniqueViolation", () => {
  it("is true for the code that the database gives for a value that is already used", () => {
    expect(isUniqueViolation({ code: "P2002" })).toBe(true);

    const error = Object.assign(new Error("Unique constraint failed"), { code: "P2002" });

    expect(isUniqueViolation(error)).toBe(true);
  });

  it("is false for every other problem", () => {
    expect(isUniqueViolation({ code: "P2025" })).toBe(false);

    expect(isUniqueViolation({ code: 2002 })).toBe(false);

    expect(isUniqueViolation({})).toBe(false);

    expect(isUniqueViolation(new Error("P2002"))).toBe(false);

    expect(isUniqueViolation("P2002")).toBe(false);

    expect(isUniqueViolation(null)).toBe(false);

    expect(isUniqueViolation(undefined)).toBe(false);

    expect(isUniqueViolation(2002)).toBe(false);
  });
});

describe("limits", () => {
  it("allows 5 tries in 15 minutes", () => {
    expect(EMAIL_CHANGE_LIMIT).toBe(5);

    expect(EMAIL_CHANGE_WINDOW_MS).toBe(15 * 60 * 1000);
  });
});

describe("messages", () => {
  it("has one clear sentence for each code", () => {
    expect(Object.keys(EMAIL_CHANGE_MESSAGES).sort()).toEqual([
      "email-invalid",
      "email-mismatch",
      "email-password",
      "email-rate-limit",
      "email-same",
      "email-taken",
    ]);

    for (const [code, message] of Object.entries(EMAIL_CHANGE_MESSAGES)) {
      expect(code).toMatch(/^email-[a-z-]+$/);

      expect(message.length).toBeGreaterThan(15);

      expect(message.endsWith(".")).toBe(true);

      expect(message).toBe(message.trim());
    }
  });

  it("are fixed texts without placeholders, so a message cannot repeat an address", () => {
    for (const message of Object.values(EMAIL_CHANGE_MESSAGES)) {
      expect(message).not.toMatch(/\$\{|\{\w*\}|%s/);
    }
  });
});

describe("the notice on the sign-in page after a change", () => {
  it("tells the person that every session was signed out", () => {
    const notice = getLoginNotice("email-changed");

    expect(notice?.tone).toBe("success");

    expect(notice?.title).toBe("Email address updated");

    expect(notice?.message).toContain("every session was signed out");

    expect(notice?.message).toContain("Sign in with your new email address");
  });

  it("is only shown for the exact code", () => {
    expect(getLoginNotice("email-change")).toBe(null);

    expect(getLoginNotice(["email-changed", "email-changed"])).toBe(null);
  });
});

describe("the recovery key", () => {
  it("is calculated from the secret, the account and the password hash, never the email", () => {
    expect(deriveRecoveryKey.length).toBe(3);

    const secret = "secret-secret-secret-secret-secret";

    const key = deriveRecoveryKey(secret, "user-1", "hash-1");

    expect(deriveRecoveryKey(secret, "user-1", "hash-1")).toBe(key);

    expect(deriveRecoveryKey(secret, "user-2", "hash-1")).not.toBe(key);

    expect(deriveRecoveryKey(secret, "user-1", "hash-2")).not.toBe(key);
  });
});
