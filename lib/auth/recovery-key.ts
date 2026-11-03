import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Account recovery key.
 *
 * VentureScope sends no emails, so a forgotten password is reset with a key that the
 * person can show while signed in. Nothing is stored: the key is calculated from the
 * server secret, the account id and the current password hash. That means:
 *
 * - it changes by itself every time the password changes or is reset,
 * - an old key stops working as soon as it has been used,
 * - without the server secret nobody can calculate it.
 */

/** Crockford base32: no I, L, O or U, so the key is easy to read and type. */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

const KEY_BYTES = 15;

/** 15 bytes are 120 bits, which is exactly 24 base32 characters. */
export const RECOVERY_KEY_LENGTH = 24;

const KEY_LABEL = "venturescope:recovery-key:v1";

function encodeBase32(bytes: Uint8Array): string {
  let output = "";
  let value = 0;
  let bits = 0;

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }

    value &= (1 << bits) - 1;
  }

  if (bits > 0) {
    output += ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/** The raw key: 24 characters from the alphabet above, without dashes. */
export function deriveRecoveryKey(secret: string, userId: string, passwordHash: string): string {
  const digest = createHmac("sha256", secret)
    .update(`${KEY_LABEL}\n${userId}\n${passwordHash}`)
    .digest();

  return encodeBase32(digest.subarray(0, KEY_BYTES));
}

/** Groups of four, for example ABCD-EFGH-JKMN-PQRS-TVWX-YZ01. */
export function formatRecoveryKey(key: string): string {
  return (key.match(/.{1,4}/g) ?? []).join("-");
}

/** Accepts lower case, spaces, dashes, and the usual look-alike characters. */
export function normalizeRecoveryKey(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1");
}

export function recoveryKeyMatches(
  secret: string,
  userId: string,
  passwordHash: string,
  input: string,
): boolean {
  const given = normalizeRecoveryKey(input);

  if (given.length !== RECOVERY_KEY_LENGTH) {
    return false;
  }

  const expected = deriveRecoveryKey(secret, userId, passwordHash);

  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}
