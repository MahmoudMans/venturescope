export const DISPLAY_NAME_MIN_LENGTH = 2;

export const DISPLAY_NAME_MAX_LENGTH = 80;

export type DisplayNameResult = { ok: true; name: string } | { ok: false };

/**
 * Cleans a display name the way registration expects it: surrounding spaces
 * are removed, runs of whitespace become one space, and the result must be
 * 2 to 80 characters without control characters.
 */
export function normalizeDisplayName(input: string): DisplayNameResult {
  const name = input.replace(/\s+/g, " ").trim();

  if (name.length < DISPLAY_NAME_MIN_LENGTH || name.length > DISPLAY_NAME_MAX_LENGTH) {
    return { ok: false };
  }

  if (/[\u0000-\u001f\u007f-\u009f]/.test(name)) {
    return { ok: false };
  }

  return { ok: true, name };
}

export type ProfileNotice = {
  tone: "success" | "error";
  message: string;
};

const NOTICES: Record<string, ProfileNotice> = {
  "profile-saved": {
    tone: "success",
    message: "Your name was saved.",
  },

  "invalid-name": {
    tone: "error",
    message: `Use ${DISPLAY_NAME_MIN_LENGTH} to ${DISPLAY_NAME_MAX_LENGTH} characters for your name, without special control characters.`,
  },
};

export function getProfileNotice(code: string | string[] | undefined): ProfileNotice | null {
  if (typeof code !== "string") {
    return null;
  }

  return Object.hasOwn(NOTICES, code) ? NOTICES[code] : null;
}

const MEMBER_SINCE_FORMAT = new Intl.DateTimeFormat("en-US", {
  dateStyle: "long",
  timeZone: "UTC",
});

/** "October 16, 2026". Always UTC so the server and every browser agree. */
export function formatMemberSince(date: Date): string {
  return MEMBER_SINCE_FORMAT.format(date);
}
