import { describe, expect, it } from "vitest";

import {
  RECOVERY_REMINDER_MAX_AGE_SECONDS,
  isRecoveryReminderAcknowledged,
  recoveryReminderCookieName,
  recoveryReminderCookieOptions,
  recoveryReminderToken,
} from "@/lib/auth/recovery-reminder";

const SECRET = "a-long-secret-for-the-tests-0123456789";

const USER = "user_1";

const HASH = "$argon2id$v=19$m=19456,t=2,p=1$abc$def";

describe("recoveryReminderCookieName", () => {
  it("is safe to use as a cookie name", () => {
    expect(recoveryReminderCookieName(USER)).toMatch(/^vs_ra_[0-9a-f]{16}$/);
  });

  it("is the same for the same account and different for another account", () => {
    expect(recoveryReminderCookieName(USER)).toBe(recoveryReminderCookieName(USER));

    expect(recoveryReminderCookieName("user_2")).not.toBe(recoveryReminderCookieName(USER));
  });

  it("does not show the account id", () => {
    expect(recoveryReminderCookieName(USER)).not.toContain(USER);
  });
});

describe("recoveryReminderToken", () => {
  it("is a short text that can sit in a cookie", () => {
    expect(recoveryReminderToken(SECRET, USER, HASH)).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("is the same every time for the same input", () => {
    expect(recoveryReminderToken(SECRET, USER, HASH)).toBe(
      recoveryReminderToken(SECRET, USER, HASH),
    );
  });

  it("changes with the secret, the account and the password", () => {
    const token = recoveryReminderToken(SECRET, USER, HASH);

    expect(recoveryReminderToken(`${SECRET}x`, USER, HASH)).not.toBe(token);

    expect(recoveryReminderToken(SECRET, "user_2", HASH)).not.toBe(token);

    expect(recoveryReminderToken(SECRET, USER, `${HASH}x`)).not.toBe(token);
  });

  it("does not contain the password hash or the account id", () => {
    const token = recoveryReminderToken(SECRET, USER, HASH);

    expect(token).not.toContain(HASH);

    expect(token).not.toContain(USER);
  });

  it("keeps the parts apart, so two inputs cannot make the same value", () => {
    expect(recoveryReminderToken(SECRET, "ab", "c")).not.toBe(
      recoveryReminderToken(SECRET, "a", "bc"),
    );
  });
});

describe("isRecoveryReminderAcknowledged", () => {
  const good = recoveryReminderToken(SECRET, USER, HASH);

  it("accepts the exact value", () => {
    expect(isRecoveryReminderAcknowledged(SECRET, USER, HASH, good)).toBe(true);
  });

  it("refuses when there is no cookie or it is empty", () => {
    expect(isRecoveryReminderAcknowledged(SECRET, USER, HASH, undefined)).toBe(false);

    expect(isRecoveryReminderAcknowledged(SECRET, USER, HASH, "")).toBe(false);
  });

  it("refuses a value that was changed, cut short or made longer", () => {
    expect(isRecoveryReminderAcknowledged(SECRET, USER, HASH, `${good.slice(0, -1)}x`)).toBe(false);

    expect(isRecoveryReminderAcknowledged(SECRET, USER, HASH, good.slice(0, -1))).toBe(false);

    expect(isRecoveryReminderAcknowledged(SECRET, USER, HASH, `${good}x`)).toBe(false);

    expect(isRecoveryReminderAcknowledged(SECRET, USER, HASH, "1")).toBe(false);
  });

  it("refuses after the password changed", () => {
    expect(isRecoveryReminderAcknowledged(SECRET, USER, `${HASH}new`, good)).toBe(false);
  });

  it("refuses the cookie of another account", () => {
    expect(isRecoveryReminderAcknowledged(SECRET, "user_2", HASH, good)).toBe(false);
  });

  it("refuses when the server secret changed", () => {
    expect(isRecoveryReminderAcknowledged(`${SECRET}x`, USER, HASH, good)).toBe(false);
  });
});

describe("recoveryReminderCookieOptions", () => {
  it("keeps the cookie private to the server and on this site", () => {
    const options = recoveryReminderCookieOptions("http://localhost:3000");

    expect(options.httpOnly).toBe(true);

    expect(options.sameSite).toBe("lax");

    expect(options.path).toBe("/");
  });

  it("lasts one year", () => {
    expect(RECOVERY_REMINDER_MAX_AGE_SECONDS).toBe(31_536_000);

    expect(recoveryReminderCookieOptions(undefined).maxAge).toBe(RECOVERY_REMINDER_MAX_AGE_SECONDS);
  });

  it("is only sent over https when the site uses https", () => {
    expect(recoveryReminderCookieOptions("https://venturescope.example").secure).toBe(true);

    expect(recoveryReminderCookieOptions("http://localhost:3000").secure).toBe(false);

    expect(recoveryReminderCookieOptions(undefined).secure).toBe(false);

    expect(recoveryReminderCookieOptions("").secure).toBe(false);
  });
});
