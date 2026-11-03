import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { HELP_GROUPS } from "@/lib/site/help-content";

const read = (path: string) => readFileSync(path, "utf8");

const ackAction = read("app/(app)/account/security/reminder-actions.ts");

const loader = read("lib/auth/load-recovery-reminder.ts");

const reminder = read("lib/auth/recovery-reminder.ts");

const state = read("lib/auth/recovery-state.ts");

const ackForm = read("components/account/recovery-ack-form.tsx");

const card = read("components/account/recovery-reminder-card.tsx");

const keyForm = read("components/account/recovery-key-form.tsx");

const dashboard = read("app/(app)/dashboard/page.tsx");

const securityPage = read("app/(app)/account/security/page.tsx");

const loginForm = read("components/auth/login-form.tsx");

const forgotPage = read("app/(auth)/forgot-password/page.tsx");

const forgotAction = read("app/(auth)/forgot-password/actions.ts");

const resetForm = read("components/auth/reset-password-form.tsx");

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

describe("acknowledge action", () => {
  it("is a server action and exports only one async function", () => {
    expect(ackAction.startsWith('"use server";')).toBe(true);

    expect(ackAction.match(/^export .*/gm) ?? []).toEqual([
      "export async function acknowledgeRecoveryKeyAction(): Promise<RecoveryAckState> {",
    ]);
  });

  it("checks who is asking before it does anything else", () => {
    expect(
      isIncreasing(
        positions(ackAction, [
          "const user = await requireUser();",
          "const secret = process.env.AUTH_SECRET;",
          "prisma.user.findUnique(",
          "const store = await cookies();",
          "store.set(",
          'revalidatePath("/dashboard");',
          "saved: true",
        ]),
      ),
    ).toBe(true);
  });

  it("looks at its own account and nothing else", () => {
    expect(has(ackAction, "where: { id: user.id, }")).toBe(true);

    expect(has(ackAction, "select: { passwordHash: true, }")).toBe(true);
  });

  it("stops with a message when there is no secret or no account", () => {
    expect(has(ackAction, 'if (secret === undefined || secret === "") {')).toBe(true);

    expect(has(ackAction, "if (account === null) {")).toBe(true);

    expect(ackAction).toContain("The recovery key is not available right now.");

    expect(ackAction).toContain("Your account could not be found.");
  });

  it("sets the signed cookie with the shared options", () => {
    expect(
      has(
        ackAction,
        `store.set(
          recoveryReminderCookieName(user.id),
          recoveryReminderToken(secret, user.id, account.passwordHash),
          recoveryReminderCookieOptions(process.env.AUTH_URL),
        );`,
      ),
    ).toBe(true);
  });

  it("changes nothing in the database", () => {
    for (const write of [
      "create(",
      "update(",
      "updateMany(",
      "upsert(",
      "delete(",
      "deleteMany(",
    ]) {
      expect(ackAction.includes(`.${write}`), write).toBe(false);
    }

    expect(ackAction).not.toContain("$transaction");
  });

  it("never sends the password hash or the recovery key back", () => {
    expect(ackAction).not.toContain("recovery-key");

    expect(ackAction).not.toContain("deriveRecoveryKey");

    expect(has(ackAction, "return { saved: true, };")).toBe(true);
  });
});

describe("reminder loader", () => {
  it("looks at the secret, then the account, then the cookie", () => {
    expect(
      isIncreasing(
        positions(loader, [
          "const secret = process.env.AUTH_SECRET;",
          'if (secret === undefined || secret === "") {',
          "prisma.user.findUnique(",
          "if (account === null) {",
          "const store = await cookies();",
          "store.get(recoveryReminderCookieName(userId))?.value",
          "isRecoveryReminderAcknowledged(secret, userId, account.passwordHash, saved)",
          '? "saved"',
          ': "not-saved"',
        ]),
      ),
    ).toBe(true);
  });

  it("has no key to talk about without a secret or an account", () => {
    expect(
      has(loader, 'if (secret === undefined || secret === "") { return "unavailable"; }'),
    ).toBe(true);

    expect(has(loader, 'if (account === null) { return "unavailable"; }')).toBe(true);
  });

  it("asks for the reminder only when the person did not say that the key is saved", () => {
    expect(has(loader, 'return (await loadRecoveryKeyStatus(userId)) === "not-saved";')).toBe(true);
  });

  it("reads only, and takes the password hash from the database", () => {
    expect(has(loader, "where: { id: userId, }")).toBe(true);

    expect(has(loader, "select: { passwordHash: true, }")).toBe(true);

    expect(loader).not.toContain("store.set(");

    expect(loader).not.toContain(".update(");
  });
});

describe("reminder helper", () => {
  it("uses only the Node crypto module and no database", () => {
    expect(reminder).toContain('from "node:crypto"');

    expect(reminder).not.toContain("prisma");

    expect(reminder).not.toContain("next/");
  });

  it("compares the cookie in constant time, after the length", () => {
    expect(
      has(reminder, "given.length === expected.length && timingSafeEqual(given, expected)"),
    ).toBe(true);
  });

  it("calculates the cookie from the secret, the account and the password hash", () => {
    expect(has(reminder, 'createHmac("sha256", secret)')).toBe(true);

    expect(has(reminder, "`${TOKEN_LABEL}\\n${userId}\\n${passwordHash}`")).toBe(true);
  });
});

describe("state", () => {
  it("has a type and a first value for the answer", () => {
    const type = state.slice(state.indexOf("export type RecoveryAckState"));

    expect(has(type.slice(0, type.indexOf("};")), "{ message?: string;")).toBe(true);

    expect(has(type.slice(0, type.indexOf("};")), "saved?: boolean;")).toBe(true);

    expect(has(state, "export const initialRecoveryAckState: RecoveryAckState = {};")).toBe(true);
  });
});

describe("acknowledge form", () => {
  it("is a client component that calls the action", () => {
    expect(ackForm.startsWith('"use client";')).toBe(true);

    expect(
      has(ackForm, "useActionState(acknowledgeRecoveryKeyAction, initialRecoveryAckState)"),
    ).toBe(true);
  });

  it("tells the person when it is saved, and shows a problem when there is one", () => {
    expect(has(ackForm, "if (state.saved === true) {")).toBe(true);

    expect(ackForm).toContain('role="status"');

    expect(ackForm).toContain("will not remind you on this device until your password changes");

    expect(has(ackForm, 'tone="error"')).toBe(true);

    expect(has(ackForm, "{state.message ?")).toBe(true);
  });

  it("has a button with a waiting text and a quiet style by default", () => {
    expect(ackForm).toContain('variant = "outline"');

    expect(ackForm).toContain('pendingLabel="Saving..."');

    expect(ackForm).toContain("{label}");
  });
});

describe("reminder card", () => {
  it("is a server component with a clear title and a short reason", () => {
    expect(card).not.toContain('"use client"');

    expect(card).toContain("Save your recovery key");

    expect(card).toContain("VentureScope sends no emails.");

    expect(card).toContain('aria-labelledby="recovery-reminder-title"');

    expect(card).toContain('id="recovery-reminder-title"');
  });

  it("takes the person to the key, or lets them say that it is done", () => {
    expect(card).toContain('href="/account/security#recovery-key"');

    expect(card).toContain("Show my recovery key");

    expect(has(card, '<RecoveryAckForm label="I already saved it" variant="ghost" />')).toBe(true);
  });
});

describe("dashboard", () => {
  it("asks for the reminder together with its other data", () => {
    expect(
      has(
        dashboard,
        `const [models, sharedModels, displayName, showRecoveryReminder] = await Promise.all([
          loadDashboardModels(user.id),
          loadSharedModels(user.id),
          loadDisplayName(user.id, user.name),
          shouldShowRecoveryReminder(user.id),
        ]);`,
      ),
    ).toBe(true);
  });

  it("shows the card after the notice and before the numbers", () => {
    expect(
      isIncreasing(
        positions(dashboard, [
          "{notice ? <StatusNotice",
          "{showRecoveryReminder ? <RecoveryReminderCard /> : null}",
          'aria-label="Portfolio summary"',
        ]),
      ),
    ).toBe(true);
  });
});

describe("account pages", () => {
  it("lets the card link to the recovery key", () => {
    expect(securityPage).toContain('<Card id="recovery-key"');
  });

  it("shows the second button only after the key is shown, and outside the password form", () => {
    expect(
      isIncreasing(
        positions(keyForm, [
          "</form>",
          "{state.recoveryKey ? (",
          '<RecoveryAckForm label="I saved my key" />',
        ]),
      ),
    ).toBe(true);
  });
});

describe("forgot password keeps the page", () => {
  it("is linked from the sign-in form with the page", () => {
    expect(has(loginForm, 'authPageHref("/forgot-password", { next: returnTo })')).toBe(true);
  });

  it("reads the page, checks it, and gives it to the form", () => {
    expect(has(forgotPage, "searchParams: Promise<{ next?: string | string[] }>")).toBe(true);

    expect(
      isIncreasing(
        positions(forgotPage, [
          "const session = await auth();",
          "if (session?.user) {",
          'redirect("/account/security");',
          "const { next } = await searchParams;",
          "<ResetPasswordForm returnTo={safeReturnPath(next)} />",
        ]),
      ),
    ).toBe(true);
  });

  it("sends the page in a hidden field and keeps it in the link back", () => {
    expect(
      has(resetForm, '{returnTo ? <input type="hidden" name="next" value={returnTo} /> : null}'),
    ).toBe(true);

    expect(has(resetForm, 'authPageHref("/login", { next: returnTo })')).toBe(true);

    expect(has(resetForm, "describeResetIntro(returnTo)")).toBe(true);
  });

  it("sends the person to the sign-in page with the page after the reset", () => {
    expect(
      has(
        forgotAction,
        'redirect(authPageHref("/login", { security: "password-reset", next: text(formData, "next") }));',
      ),
    ).toBe(true);

    expect(forgotAction).toContain('import { authPageHref } from "@/lib/auth/return-path";');
  });
});

describe("help and readme", () => {
  const items = HELP_GROUPS.flatMap((group) => group.items);

  it("explains the reminder in the account group, after the recovery key", () => {
    const group = HELP_GROUPS.find((candidate) => candidate.id === "account-and-security");

    const ids = (group?.items ?? []).map((item) => item.id);

    expect(ids.indexOf("recovery-reminder")).toBe(ids.indexOf("recovery-key") + 1);
  });

  it("uses the same words as the buttons", () => {
    const text = (items.find((item) => item.id === "recovery-reminder")?.answer ?? []).join(" ");

    for (const words of [
      "Show my recovery key",
      "I saved my key",
      "I already saved it",
      "only in this browser",
      "until your password changes",
    ]) {
      expect(text, words).toContain(words);
    }
  });

  it("says that the invitation is kept after a reset", () => {
    const text = (items.find((item) => item.id === "forgot-password")?.answer ?? []).join(" ");

    expect(text).toContain("brings you back to it");

    expect(text).toContain("cannot be recovered");
  });

  it("describes the reminder in the readme", () => {
    const start = readme.indexOf("## Save your recovery key");

    const end = readme.indexOf("\n## ", start + 1);

    expect(start).toBeGreaterThan(-1);

    const section = readme.slice(start, end);

    for (const words of [
      "I saved my key",
      "I already saved it",
      "No database change",
      "AUTH_SECRET",
      "No secret, no card",
      "Two accounts in",
    ]) {
      expect(squash(section), words).toContain(squash(words));
    }
  });

  it("does not say any more that the reset forgets the page", () => {
    expect(readme).not.toContain("the reset does not keep the page");
  });
});
