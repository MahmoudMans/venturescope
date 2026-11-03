import { describe, expect, it } from "vitest";

import {
  DISPLAY_NAME_MAX_LENGTH,
  formatMemberSince,
  getProfileNotice,
  normalizeDisplayName,
} from "@/lib/account/profile";

describe("display name", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizeDisplayName("  Ada   Lovelace \n")).toEqual({ ok: true, name: "Ada Lovelace" });

    expect(normalizeDisplayName("Ada\t\nLovelace")).toEqual({ ok: true, name: "Ada Lovelace" });
  });

  it("accepts the shortest and the longest valid names", () => {
    expect(normalizeDisplayName("Al")).toEqual({ ok: true, name: "Al" });

    const longest = "a".repeat(DISPLAY_NAME_MAX_LENGTH);

    expect(normalizeDisplayName(longest)).toEqual({ ok: true, name: longest });
  });

  it("rejects names that are too short or too long", () => {
    expect(normalizeDisplayName("")).toEqual({ ok: false });

    expect(normalizeDisplayName("   ")).toEqual({ ok: false });

    expect(normalizeDisplayName("A")).toEqual({ ok: false });

    expect(normalizeDisplayName("a".repeat(DISPLAY_NAME_MAX_LENGTH + 1))).toEqual({ ok: false });
  });

  it("rejects control characters", () => {
    expect(normalizeDisplayName("Ada\u0000Lovelace")).toEqual({ ok: false });

    expect(normalizeDisplayName("Ada\u007fLovelace")).toEqual({ ok: false });
  });

  it("keeps accents and non-Latin letters", () => {
    expect(normalizeDisplayName("Zo\u00eb M\u00fcller")).toEqual({
      ok: true,
      name: "Zo\u00eb M\u00fcller",
    });

    expect(normalizeDisplayName("\u0645\u062d\u0645\u0648\u062f")).toEqual({
      ok: true,
      name: "\u0645\u062d\u0645\u0648\u062f",
    });
  });
});

describe("profile notices", () => {
  it("explains the two status codes the profile action sends", () => {
    expect(getProfileNotice("profile-saved")?.tone).toBe("success");

    expect(getProfileNotice("invalid-name")?.tone).toBe("error");
  });

  it("ignores missing, repeated and unknown codes", () => {
    expect(getProfileNotice(undefined)).toBe(null);

    expect(getProfileNotice(["profile-saved"])).toBe(null);

    expect(getProfileNotice("nope")).toBe(null);

    expect(getProfileNotice("constructor")).toBe(null);
  });
});

describe("member since", () => {
  it("formats the date in UTC", () => {
    expect(formatMemberSince(new Date("2026-10-16T08:30:00Z"))).toBe("October 16, 2026");

    expect(formatMemberSince(new Date("2026-01-01T00:00:00Z"))).toBe("January 1, 2026");

    expect(formatMemberSince(new Date("2026-12-31T23:59:59Z"))).toBe("December 31, 2026");
  });
});
