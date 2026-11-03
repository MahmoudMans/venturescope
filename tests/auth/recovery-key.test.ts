import { describe, expect, it } from "vitest";

import {
  RECOVERY_KEY_LENGTH,
  deriveRecoveryKey,
  formatRecoveryKey,
  normalizeRecoveryKey,
  recoveryKeyMatches,
} from "@/lib/auth/recovery-key";

const SECRET = "test-secret-test-secret-test-secret-0";

const USER = "user_1";

const HASH = "$2a$12$abcdefghijklmnopqrstuv";

const KEY = "0297WFF2VBKENXFGJSN8ZWW7";

describe("deriveRecoveryKey", () => {
  it("gives the same answer as an independent reference implementation", () => {
    // These values were calculated with a separate Python script (HMAC-SHA256, 15 bytes, base32).
    expect(deriveRecoveryKey(SECRET, USER, HASH)).toBe(KEY);

    expect(
      deriveRecoveryKey(
        "another-secret-another-secret-9999",
        "clx0000000000000000000000",
        "$2b$12$ZZZZZZZZZZZZZZZZZZZZZZ",
      ),
    ).toBe("3XHFWK28VJMBB25RPZJ92ZCF");

    expect(deriveRecoveryKey("s", "u", "h")).toBe("V5P1DHJPF9ZRRPV2NJ06WFQW");
  });

  it("is 24 easy-to-read characters", () => {
    const key = deriveRecoveryKey(SECRET, USER, HASH);

    expect(key).toHaveLength(RECOVERY_KEY_LENGTH);

    expect(key).toMatch(/^[0-9A-HJKMNP-TV-Z]{24}$/);
  });

  it("never changes for the same account", () => {
    expect(deriveRecoveryKey(SECRET, USER, HASH)).toBe(deriveRecoveryKey(SECRET, USER, HASH));
  });

  it("changes when the password hash changes", () => {
    expect(deriveRecoveryKey(SECRET, USER, `${HASH}x`)).not.toBe(KEY);
  });

  it("is different for every account and every server secret", () => {
    expect(deriveRecoveryKey(SECRET, "user_2", HASH)).not.toBe(KEY);

    expect(deriveRecoveryKey(`${SECRET}x`, USER, HASH)).not.toBe(KEY);
  });

  it("does not mix up account id and password hash", () => {
    expect(deriveRecoveryKey(SECRET, HASH, USER)).not.toBe(KEY);
  });
});

describe("formatRecoveryKey", () => {
  it("shows the key in six groups of four", () => {
    expect(formatRecoveryKey(KEY)).toBe("0297-WFF2-VBKE-NXFG-JSN8-ZWW7");
  });
});

describe("normalizeRecoveryKey", () => {
  it("ignores case, spaces and dashes", () => {
    expect(normalizeRecoveryKey("0297-wff2 vbke-nxfg jsn8-zww7")).toBe(KEY);

    expect(normalizeRecoveryKey("  0297WFF2VBKENXFGJSN8ZWW7\n")).toBe(KEY);
  });

  it("fixes look-alike characters", () => {
    expect(normalizeRecoveryKey("O297WFF2VBKENXFGJSN8ZWW7")).toBe(KEY);

    expect(normalizeRecoveryKey("V5PlDHJPF9ZRRPV2NJ06WFQW")).toBe("V5P1DHJPF9ZRRPV2NJ06WFQW");

    expect(normalizeRecoveryKey("V5PIDHJPF9ZRRPV2NJ06WFQW")).toBe("V5P1DHJPF9ZRRPV2NJ06WFQW");
  });

  it("removes every other symbol", () => {
    expect(normalizeRecoveryKey("a.b_c/d")).toBe("ABCD");
  });
});

describe("recoveryKeyMatches", () => {
  it("accepts the key in any normal way of writing it", () => {
    expect(recoveryKeyMatches(SECRET, USER, HASH, KEY)).toBe(true);

    expect(recoveryKeyMatches(SECRET, USER, HASH, formatRecoveryKey(KEY))).toBe(true);

    expect(recoveryKeyMatches(SECRET, USER, HASH, "o297-wff2-vbke-nxfg-jsn8-zww7")).toBe(true);
  });

  it("rejects a wrong key", () => {
    expect(recoveryKeyMatches(SECRET, USER, HASH, "0297WFF2VBKENXFGJSN8ZWW8")).toBe(false);

    expect(recoveryKeyMatches(SECRET, USER, HASH, "AAAAAAAAAAAAAAAAAAAAAAAA")).toBe(false);
  });

  it("rejects keys of the wrong length", () => {
    expect(recoveryKeyMatches(SECRET, USER, HASH, "")).toBe(false);

    expect(recoveryKeyMatches(SECRET, USER, HASH, "0297")).toBe(false);

    expect(recoveryKeyMatches(SECRET, USER, HASH, `${KEY}0`)).toBe(false);
  });

  it("rejects the key of another account", () => {
    const other = deriveRecoveryKey(SECRET, "user_2", HASH);

    expect(recoveryKeyMatches(SECRET, USER, HASH, other)).toBe(false);
  });

  it("stops working once the password has changed", () => {
    expect(recoveryKeyMatches(SECRET, USER, "$2a$12$a-brand-new-hash-after-reset", KEY)).toBe(
      false,
    );
  });

  it("stops working when the server secret changes", () => {
    expect(recoveryKeyMatches(`${SECRET}x`, USER, HASH, KEY)).toBe(false);
  });
});
