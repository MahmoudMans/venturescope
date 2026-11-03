import { describe, expect, it } from "vitest";

import {
  INVITATION_DAYS,
  describeInvitationTiming,
  describeRenewDialog,
  invitationStatus,
  inviterLabel,
  sortInvitations,
  toInvitationRole,
  viewInvitation,
} from "@/lib/workspaces/invitation-state";
import { invitationExpiry } from "@/lib/workspaces/invitations";

const DAY = 24 * 60 * 60 * 1000;

const NOW = new Date("2026-10-17T10:00:00.000Z");

const at = (ms: number) => new Date(NOW.getTime() + ms);

describe("invitation length", () => {
  it("is the same number of days that new links really get", () => {
    expect(INVITATION_DAYS).toBe(7);

    expect(invitationExpiry(NOW).getTime() - NOW.getTime()).toBe(INVITATION_DAYS * DAY);
  });
});

describe("invitationStatus", () => {
  it("is pending until the moment of expiry", () => {
    expect(invitationStatus(at(DAY), NOW)).toBe("pending");

    expect(invitationStatus(at(1), NOW)).toBe("pending");
  });

  it("is expired at the moment of expiry and after it", () => {
    expect(invitationStatus(at(0), NOW)).toBe("expired");

    expect(invitationStatus(at(-1), NOW)).toBe("expired");

    expect(invitationStatus(at(-30 * DAY), NOW)).toBe("expired");
  });
});

describe("describeInvitationTiming", () => {
  it("counts the days that are left", () => {
    expect(describeInvitationTiming(at(7 * DAY), NOW)).toBe("Expires Oct 24, 2026 (7 days left)");

    expect(describeInvitationTiming(at(2 * DAY), NOW)).toBe("Expires Oct 19, 2026 (2 days left)");
  });

  it("counts a day that has started as a day, so a new link says 7 days", () => {
    expect(describeInvitationTiming(at(7 * DAY - 1), NOW)).toBe(
      "Expires Oct 24, 2026 (7 days left)",
    );

    expect(describeInvitationTiming(at(6 * DAY + 23 * 60 * 60 * 1000), NOW)).toBe(
      "Expires Oct 24, 2026 (7 days left)",
    );

    expect(describeInvitationTiming(at(DAY + 1), NOW)).toBe("Expires Oct 18, 2026 (2 days left)");
  });

  it("uses the singular for exactly one day", () => {
    expect(describeInvitationTiming(at(DAY), NOW)).toBe("Expires Oct 18, 2026 (1 day left)");
  });

  it("says less than 1 day when a full day is not left", () => {
    expect(describeInvitationTiming(at(DAY - 1), NOW)).toBe(
      "Expires Oct 18, 2026 (less than 1 day left)",
    );

    expect(describeInvitationTiming(at(1), NOW)).toBe(
      "Expires Oct 17, 2026 (less than 1 day left)",
    );
  });

  it("gives the date of an expired link", () => {
    expect(describeInvitationTiming(at(-7 * DAY), NOW)).toBe("Expired on Oct 10, 2026");

    expect(describeInvitationTiming(at(0), NOW)).toBe("Expired on Oct 17, 2026");

    expect(describeInvitationTiming(at(-1), NOW)).toBe("Expired on Oct 17, 2026");
  });

  it("always uses the UTC date", () => {
    const lateEvening = new Date("2026-10-17T23:30:00.000Z");

    expect(describeInvitationTiming(new Date("2026-10-17T23:59:00.000Z"), lateEvening)).toBe(
      "Expires Oct 17, 2026 (less than 1 day left)",
    );
  });
});

describe("sortInvitations", () => {
  const link = (name: string, expiresIn: number, createdAgo: number) => ({
    name,

    expiresAt: at(expiresIn),

    createdAt: at(-createdAgo),
  });

  it("puts the links that still work first, newest first", () => {
    const sorted = sortInvitations(
      [link("old pending", 2 * DAY, 5 * DAY), link("new pending", 6 * DAY, DAY)],
      NOW,
    );

    expect(sorted.map((item) => item.name)).toEqual(["new pending", "old pending"]);
  });

  it("puts the expired links after the others, newest first", () => {
    const sorted = sortInvitations(
      [
        link("expired old", -4 * DAY, 11 * DAY),
        link("pending", DAY, 6 * DAY),
        link("expired new", -DAY, 8 * DAY),
      ],
      NOW,
    );

    expect(sorted.map((item) => item.name)).toEqual(["pending", "expired new", "expired old"]);
  });

  it("does not change the list it was given", () => {
    const input = [link("expired", -DAY, 8 * DAY), link("pending", DAY, DAY)];

    const copy = [...input];

    const sorted = sortInvitations(input, NOW);

    expect(input).toEqual(copy);

    expect(sorted).not.toBe(input);
  });

  it("handles an empty list and a list with one link", () => {
    expect(sortInvitations([], NOW)).toEqual([]);

    expect(sortInvitations([link("one", DAY, DAY)], NOW)).toHaveLength(1);
  });

  it("gives the same order when two links were made at the same moment", () => {
    const sorted = sortInvitations([link("short", DAY, DAY), link("long", 3 * DAY, DAY)], NOW);

    expect(sorted.map((item) => item.name)).toEqual(["long", "short"]);
  });
});

describe("toInvitationRole", () => {
  it("keeps the two roles that can be invited", () => {
    expect(toInvitationRole("EDITOR")).toBe("EDITOR");

    expect(toInvitationRole("VIEWER")).toBe("VIEWER");
  });

  it("turns everything else into the safest role", () => {
    for (const value of ["OWNER", "", "editor", "ADMIN", " EDITOR"]) {
      expect(toInvitationRole(value), value).toBe("VIEWER");
    }
  });
});

describe("describeRenewDialog", () => {
  it("asks about the person and names the address", () => {
    const dialog = describeRenewDialog("ana@example.com", "pending");

    expect(dialog.title).toBe("Create a new link for ana@example.com?");
  });

  it("warns that a link that still works will stop", () => {
    const text = describeRenewDialog("ana@example.com", "pending").description;

    expect(text).toContain("stops working at once");

    expect(text).toContain("ana@example.com");

    expect(text).toContain(`${INVITATION_DAYS} days`);
  });

  it("does not warn about a link that has already expired", () => {
    const text = describeRenewDialog("ana@example.com", "expired").description;

    expect(text).toContain("has expired");

    expect(text).not.toContain("stops working");

    expect(text).toContain(`${INVITATION_DAYS} days`);
  });
});

describe("viewInvitation", () => {
  const open = {
    acceptedAt: null,

    expiresAt: at(3 * DAY),

    emailMatches: true,

    personIsInside: false,

    now: NOW,
  };

  it("opens a link that works for the right person", () => {
    expect(viewInvitation(open)).toEqual({ kind: "open" });
  });

  it("opens a link that works for another person, so the page can explain the problem", () => {
    expect(viewInvitation({ ...open, emailMatches: false })).toEqual({ kind: "open" });

    expect(viewInvitation({ ...open, emailMatches: false, personIsInside: true })).toEqual({
      kind: "open",
    });
  });

  it("sends the right person who is already inside to the workspace", () => {
    expect(viewInvitation({ ...open, personIsInside: true })).toEqual({ kind: "joined" });

    expect(viewInvitation({ ...open, personIsInside: true, acceptedAt: at(-DAY) })).toEqual({
      kind: "joined",
    });

    expect(viewInvitation({ ...open, personIsInside: true, expiresAt: at(-DAY) })).toEqual({
      kind: "joined",
    });
  });

  it("says a used link is missing", () => {
    expect(viewInvitation({ ...open, acceptedAt: at(-DAY) })).toEqual({ kind: "missing" });

    expect(viewInvitation({ ...open, acceptedAt: at(-DAY), emailMatches: false })).toEqual({
      kind: "missing",
    });
  });

  it("tells the right person that the link expired, with the date", () => {
    expect(viewInvitation({ ...open, expiresAt: at(-7 * DAY) })).toEqual({
      kind: "expired",

      expiredOn: "Oct 10, 2026",
    });

    expect(viewInvitation({ ...open, expiresAt: at(0) })).toEqual({
      kind: "expired",

      expiredOn: "Oct 17, 2026",
    });
  });

  it("tells a different person nothing about an expired link", () => {
    expect(viewInvitation({ ...open, expiresAt: at(-DAY), emailMatches: false })).toEqual({
      kind: "missing",
    });

    expect(
      viewInvitation({ ...open, expiresAt: at(-DAY), emailMatches: false, personIsInside: true }),
    ).toEqual({ kind: "missing" });
  });

  it("gives a used link and an expired link of a stranger the same answer", () => {
    const used = viewInvitation({ ...open, acceptedAt: at(-DAY), emailMatches: false });

    const expired = viewInvitation({ ...open, expiresAt: at(-DAY), emailMatches: false });

    expect(used).toEqual(expired);
  });
});

describe("inviterLabel", () => {
  it("uses the name of the person who invited", () => {
    expect(inviterLabel("Amira Ben")).toBe("Amira Ben");

    expect(inviterLabel("  Amira Ben  ")).toBe("Amira Ben");
  });

  it("falls back to the workspace owner when there is no name", () => {
    for (const value of [null, undefined, "", "   "]) {
      expect(inviterLabel(value), String(value)).toBe("the workspace owner");
    }
  });
});
