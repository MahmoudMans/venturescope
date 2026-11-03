import { describe, expect, it } from "vitest";

import {
  PASSWORD_REVIEW_DAYS,
  buildSecurityCheckup,
  countAttention,
  describeCheckupSummary,
  type CheckupItem,
} from "@/lib/account/security-checkup";
import type { RecoveryKeyStatus } from "@/lib/auth/recovery-reminder";

const DAY = 24 * 60 * 60 * 1000;

const NOW = new Date("2026-10-17T12:00:00Z");

const daysAgo = (days: number) => new Date(NOW.getTime() - days * DAY);

function items(
  over: Partial<{
    createdAt: Date;
    passwordChangedAt: Date | null;
    recoveryKey: RecoveryKeyStatus;
    email: string;
  }> = {},
): CheckupItem[] {
  return buildSecurityCheckup({
    now: NOW,
    createdAt: daysAgo(30),
    passwordChangedAt: null,
    recoveryKey: "saved",
    email: "amira@example.com",
    ...over,
  });
}

const byId = (list: CheckupItem[], id: CheckupItem["id"]) => list.find((item) => item.id === id);

describe("order", () => {
  it("lists the password, the recovery key and the email address", () => {
    expect(items().map((item) => item.id)).toEqual(["password", "recovery-key", "email"]);

    expect(items().map((item) => item.title)).toEqual([
      "Password",
      "Recovery key",
      "Email address",
    ]);
  });
});

describe("password", () => {
  it("is fine when it was changed lately", () => {
    const item = byId(items({ passwordChangedAt: daysAgo(10) }), "password");

    expect(item).toEqual({
      id: "password",
      tone: "good",
      title: "Password",
      detail: "Last changed on October 7, 2026.",
      action: null,
    });
  });

  it("says when the account was created if the password was never changed", () => {
    const item = byId(items({ createdAt: new Date("2026-09-01T08:00:00Z") }), "password");

    expect(item?.tone).toBe("good");

    expect(item?.detail).toBe("You chose it when you created your account on September 1, 2026.");
  });

  it("asks for a look after one year, and not one day before", () => {
    expect(PASSWORD_REVIEW_DAYS).toBe(365);

    expect(byId(items({ passwordChangedAt: daysAgo(364) }), "password")?.tone).toBe("good");

    expect(byId(items({ passwordChangedAt: daysAgo(365) }), "password")?.tone).toBe("attention");

    expect(byId(items({ passwordChangedAt: daysAgo(1000) }), "password")?.tone).toBe("attention");
  });

  it("gives an old password a hint and a button", () => {
    const item = byId(items({ passwordChangedAt: daysAgo(400) }), "password");

    expect(item?.detail).toBe(
      "Last changed on September 12, 2025. That was more than a year ago. If you use this password anywhere else, choose a new one.",
    );

    expect(item?.action).toEqual({
      label: "Change password",
      href: "/account/security#password",
    });
  });

  it("uses the creation date for an old account whose password was never changed", () => {
    const item = byId(items({ createdAt: daysAgo(800), passwordChangedAt: null }), "password");

    expect(item?.tone).toBe("attention");

    expect(item?.detail).toContain("You chose it when you created your account on");

    expect(item?.detail).toContain("more than a year ago");
  });

  it("prefers the date of the last change to the date of the account", () => {
    const item = byId(
      items({ createdAt: daysAgo(800), passwordChangedAt: daysAgo(5) }),
      "password",
    );

    expect(item?.tone).toBe("good");

    expect(item?.detail).toBe("Last changed on October 12, 2026.");
  });

  it("does not worry about a date in the future", () => {
    expect(
      byId(items({ passwordChangedAt: new Date(NOW.getTime() + 3 * DAY) }), "password")?.tone,
    ).toBe("good");
  });

  it("writes the date in UTC, so every server and browser agree", () => {
    const item = byId(items({ passwordChangedAt: new Date("2026-10-07T23:59:59Z") }), "password");

    expect(item?.detail).toBe("Last changed on October 7, 2026.");
  });
});

describe("recovery key", () => {
  it("is done when the person said that it is saved", () => {
    expect(byId(items({ recoveryKey: "saved" }), "recovery-key")).toEqual({
      id: "recovery-key",
      tone: "good",
      title: "Recovery key",
      detail:
        "You said that you saved it. VentureScope will not remind you on this device until your password changes.",
      action: null,
    });
  });

  it("asks for attention when it was not said on this device", () => {
    expect(byId(items({ recoveryKey: "not-saved" }), "recovery-key")).toEqual({
      id: "recovery-key",
      tone: "attention",
      title: "Recovery key",
      detail:
        "You have not said that you saved it on this device. Without it, a forgotten password cannot be reset.",
      action: { label: "Show my recovery key", href: "/account/security#recovery-key" },
    });
  });

  it("is only good to know when the key is not available", () => {
    const item = byId(items({ recoveryKey: "unavailable" }), "recovery-key");

    expect(item?.tone).toBe("info");

    expect(item?.detail).toBe(
      "The recovery key is not available right now. Please try again later.",
    );

    expect(item?.action).toBe(null);
  });
});

describe("email address", () => {
  it("is always good to know, with a button", () => {
    expect(byId(items(), "email")).toEqual({
      id: "email",
      tone: "info",
      title: "Email address",
      detail:
        "You sign in as amira@example.com. VentureScope sends no emails, so it cannot check that the address is yours. Workspace invitations are matched to it.",
      action: { label: "Change email", href: "/account/security#email" },
    });
  });

  it("shows the address that was given", () => {
    expect(byId(items({ email: "bilal@example.org" }), "email")?.detail).toContain(
      "You sign in as bilal@example.org.",
    );
  });
});

describe("summary", () => {
  it("counts only the items that need attention", () => {
    expect(countAttention(items())).toBe(0);

    expect(countAttention(items({ recoveryKey: "not-saved" }))).toBe(1);

    expect(
      countAttention(items({ recoveryKey: "not-saved", passwordChangedAt: daysAgo(500) })),
    ).toBe(2);

    expect(countAttention(items({ recoveryKey: "unavailable" }))).toBe(0);
  });

  it("says All good when nothing needs attention", () => {
    expect(describeCheckupSummary(items())).toEqual({ tone: "success", label: "All good" });
  });

  it("counts the things to check", () => {
    expect(describeCheckupSummary(items({ recoveryKey: "not-saved" }))).toEqual({
      tone: "warning",
      label: "1 thing to check",
    });

    expect(
      describeCheckupSummary(items({ recoveryKey: "not-saved", passwordChangedAt: daysAgo(500) })),
    ).toEqual({ tone: "warning", label: "2 things to check" });
  });
});

describe("words", () => {
  const all = [
    ...items(),
    ...items({ recoveryKey: "not-saved", passwordChangedAt: daysAgo(500) }),
    ...items({ recoveryKey: "unavailable" }),
  ];

  it("end every sentence with a full stop", () => {
    for (const item of all) {
      expect(item.detail.endsWith("."), item.detail).toBe(true);
    }
  });

  it("do not promise anything for later", () => {
    for (const item of all) {
      expect(`${item.title} ${item.detail}`).not.toMatch(
        /coming soon|comes later|will come|not yet|lorem|todo/i,
      );
    }
  });

  it("send every button to a card of the Security page", () => {
    for (const item of all) {
      if (item.action !== null) {
        expect(item.action.href).toMatch(/^\/account\/security#[a-z-]+$/);

        expect(item.action.label.length).toBeGreaterThan(3);
      }
    }
  });
});
