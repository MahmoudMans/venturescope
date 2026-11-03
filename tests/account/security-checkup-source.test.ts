import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { getLoginNotice } from "@/lib/auth/login-notices";
import { HELP_GROUPS } from "@/lib/site/help-content";

const read = (path: string) => readFileSync(path, "utf8");

const checkupLib = read("lib/account/security-checkup.ts");

const checkupLoader = read("lib/account/load-security-checkup.ts");

const statusLoader = read("lib/auth/load-recovery-reminder.ts");

const reminderLib = read("lib/auth/recovery-reminder.ts");

const card = read("components/account/security-checkup-card.tsx");

const securityPage = read("app/(app)/account/security/page.tsx");

const readme = read("README.md");

/** The text without spaces, line breaks and trailing commas, so the layout does not matter. */
const squash = (text: string) => text.replace(/\s+/g, "").replace(/,([)}\]])/g, "$1");

/** True when the squashed text contains the squashed piece. */
const has = (text: string, piece: string) => squash(text).includes(squash(piece));

/** The place of each marker in the squashed text, in the order they are given. */
function positions(text: string, markers: string[]): number[] {
  const body = squash(text);

  return markers.map((marker) => body.indexOf(squash(marker)));
}

/** True when every value was found and each one comes after the one before it. */
function isIncreasing(values: number[]): boolean {
  return values.every((value, index) => value > -1 && (index === 0 || value > values[index - 1]));
}

describe("check-up logic", () => {
  it("is plain code: no database, no framework", () => {
    for (const forbidden of ["prisma", "next/", "node:", "process.env", "new Date("]) {
      expect(checkupLib.includes(forbidden), forbidden).toBe(false);
    }
  });

  it("takes the type of the recovery key status from the one place that defines it", () => {
    expect(
      has(checkupLib, 'import type { RecoveryKeyStatus } from "@/lib/auth/recovery-reminder";'),
    ).toBe(true);

    expect(
      has(reminderLib, 'export type RecoveryKeyStatus = "saved" | "not-saved" | "unavailable";'),
    ).toBe(true);
  });

  it("looks at a password after 365 days", () => {
    expect(has(checkupLib, "export const PASSWORD_REVIEW_DAYS = 365;")).toBe(true);

    expect(has(checkupLib, "now.getTime() - since.getTime() < PASSWORD_REVIEW_DAYS * DAY_MS")).toBe(
      true,
    );
  });
});

describe("check-up loader", () => {
  it("stops without an id or an account", () => {
    expect(has(checkupLoader, 'if (userId === "") { return null; }')).toBe(true);

    expect(has(checkupLoader, "if (account === null) { return null; }")).toBe(true);
  });

  it("reads three fields of the account and the recovery key status", () => {
    expect(
      has(checkupLoader, "select: { email: true, createdAt: true, passwordChangedAt: true, }"),
    ).toBe(true);

    expect(has(checkupLoader, "where: { id: userId, }")).toBe(true);

    expect(has(checkupLoader, "recoveryKey: await loadRecoveryKeyStatus(userId),")).toBe(true);

    expect(has(checkupLoader, "now: new Date(),")).toBe(true);

    expect(has(checkupLoader, "createdAt: account.createdAt,")).toBe(true);

    expect(has(checkupLoader, "passwordChangedAt: account.passwordChangedAt,")).toBe(true);

    expect(has(checkupLoader, "email: account.email")).toBe(true);
  });

  it("never selects the password hash and changes nothing", () => {
    expect(checkupLoader).not.toContain("passwordHash");

    for (const write of [
      "create(",
      "update(",
      "updateMany(",
      "upsert(",
      "delete(",
      "deleteMany(",
    ]) {
      expect(checkupLoader.includes(`.${write}`), write).toBe(false);
    }
  });

  it("shares the recovery key status with the dashboard reminder", () => {
    expect(
      has(
        statusLoader,
        "export async function loadRecoveryKeyStatus(userId: string): Promise<RecoveryKeyStatus> {",
      ),
    ).toBe(true);

    expect(has(statusLoader, 'return (await loadRecoveryKeyStatus(userId)) === "not-saved";')).toBe(
      true,
    );
  });
});

describe("check-up card", () => {
  it("is a server component with a name for screen readers", () => {
    expect(card).not.toContain('"use client"');

    expect(card).toContain('id="checkup"');

    expect(card).toContain('aria-labelledby="security-checkup-title"');

    expect(card).toContain('id="security-checkup-title"');

    expect(card).toContain('className="[--card-spacing:--spacing(6)]"');

    expect(card).toContain("Security check-up");
  });

  it("does not use colour alone: each mark has a word for screen readers", () => {
    expect(card).toContain('<span className="sr-only"> ({tone.label})</span>');

    for (const label of ["Done", "Needs your attention", "Good to know"]) {
      expect(card).toContain(`label: "${label}"`);
    }
  });

  it("marks each tone with its own icon and colour", () => {
    expect(has(card, "good: { icon: CircleCheck,")).toBe(true);

    expect(has(card, "attention: { icon: CircleAlert,")).toBe(true);

    expect(has(card, "info: { icon: Info,")).toBe(true);

    expect(card).toContain('"bg-success/12 text-success dark:bg-success/20"');

    expect(card).toContain('"bg-warning/14 text-warning dark:bg-warning/20"');

    expect(card).toContain('"bg-info/12 text-info dark:bg-info/20"');
  });

  it("lets a long text, such as a long email address, wrap inside the card", () => {
    expect(
      has(
        card,
        '<p className="break-words text-sm leading-6 text-muted-foreground">{item.detail}</p>',
      ),
    ).toBe(true);

    expect(card).toContain('<div className="min-w-0 space-y-0.5">');

    expect(card).toContain('<div className="flex min-w-0 items-start gap-3">');
  });

  it("shows the summary badge and a list with one row for each item", () => {
    expect(has(card, "<Badge variant={summary.tone}>{summary.label}</Badge>")).toBe(true);

    expect(card).toContain("<ul");

    expect(has(card, "{items.map((item) => {")).toBe(true);

    expect(has(card, "<li key={item.id}")).toBe(true);

    expect(has(card, "const summary = describeCheckupSummary(items);")).toBe(true);

    expect(has(card, '<h3 className="text-sm font-medium">')).toBe(true);

    expect(card).toContain("sm:flex-row sm:items-center sm:justify-between");
  });

  it("shows a button only when the row has an action", () => {
    expect(has(card, "{item.action ? (")).toBe(true);

    expect(has(card, "<Link href={item.action.href}>{item.action.label}</Link>")).toBe(true);
  });
});

describe("security page", () => {
  it("loads the check-up with the id of the signed-in person", () => {
    expect(
      has(securityPage, 'const checkup = await loadSecurityCheckup(session?.user?.id ?? "");'),
    ).toBe(true);
  });

  it("shows the card under the error message and above the email card", () => {
    expect(
      isIncreasing(
        positions(securityPage, [
          "{message ? <StatusNotice",
          "{checkup === null ? null : <SecurityCheckupCard items={checkup} />}",
          '<Card id="email"',
        ]),
      ),
    ).toBe(true);
  });

  it("has a card for every button of the check-up", () => {
    const anchors = [...checkupLib.matchAll(/href: "\/account\/security#([a-z-]+)"/g)].map(
      (match) => match[1],
    );

    expect(anchors.sort()).toEqual(["email", "password", "recovery-key"]);

    for (const anchor of anchors) {
      expect(securityPage, anchor).toContain(`<Card id="${anchor}"`);
    }
  });
});

describe("messages on the sign-in page", () => {
  it("tell a person whose password changed that the recovery key changed too", () => {
    const notice = getLoginNotice("password-changed");

    expect(notice?.title).toBe("Password updated");

    expect(notice?.message).toContain("Your recovery key changed too");

    expect(notice?.message).toContain("open Account, then Security, to see the new one");
  });

  it("tell a new person that the dashboard will remind them", () => {
    const notice = getLoginNotice("account-created");

    expect(notice?.message).toContain("Your dashboard will remind you to save your recovery key");

    expect(notice?.message).toContain("the only way to reset a forgotten password");
  });

  it("say the same about the key after a reset as after a change", () => {
    const changed = getLoginNotice("password-changed")?.message ?? "";

    const reset = getLoginNotice("password-reset")?.message ?? "";

    const sentence =
      "Your recovery key changed too: open Account, then Security, to see the new one.";

    expect(changed).toContain(sentence);

    expect(reset).toContain(sentence);
  });
});

describe("help and readme", () => {
  const group = HELP_GROUPS.find((candidate) => candidate.id === "account-and-security");

  const item = group?.items.find((candidate) => candidate.id === "security-checkup");

  it("opens the account group with the check-up", () => {
    expect(group?.items[0]?.id).toBe("security-checkup");

    expect(item?.question).toBe("What is the security check-up?");
  });

  it("uses the words of the page", () => {
    const text = (item?.answer ?? []).join(" ");

    for (const words of [
      "Account, then Security",
      "when you last changed your password",
      "recovery key on this device",
      "All good",
      "workspace invitations are matched to it",
      "three things in plain words",
      "A yellow mark means that something needs your attention",
      "nothing needs your attention right now",
      "VentureScope sends no emails",
    ]) {
      expect(text, words).toContain(words);
    }
  });

  it("is described in the readme", () => {
    const start = readme.indexOf("## Security check-up");

    const end = readme.indexOf("\n## ", start + 1);

    expect(start).toBeGreaterThan(-1);

    const section = squash(readme.slice(start, end));

    for (const words of [
      "a yellow mark after 365 days",
      'always "good to know"',
      "the sign-in page now says that a changed password also changes the recovery key",
      "Change password",
      "Show my recovery key",
      "Email address",
      "No database change",
      "migration count stays at 17",
    ]) {
      expect(section, words).toContain(squash(words));
    }
  });
});
