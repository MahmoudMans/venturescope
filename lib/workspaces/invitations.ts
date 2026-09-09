import {
  createHash,
  randomBytes,
} from "node:crypto";


export function normalizeInvitationEmail(
  email:
    string,
): string {
  return email
    .trim()
    .toLowerCase();
}


export function createInvitationToken(): string {
  return randomBytes(
    32,
  ).toString(
    "base64url",
  );
}


export function hashInvitationToken(
  token:
    string,
): string {
  return createHash(
    "sha256",
  )
    .update(
      token,
      "utf8",
    )
    .digest(
      "hex",
    );
}


export function invitationExpiry(
  now:
    Date =
      new Date(),
): Date {
  const expires =
    new Date(
      now,
    );


  expires.setUTCDate(
    expires.getUTCDate() +
      7,
  );


  return expires;
}
