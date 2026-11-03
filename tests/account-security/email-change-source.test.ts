import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  EMAIL_CHANGE_LIMIT,
  EMAIL_CHANGE_MESSAGES,
  EMAIL_CHANGE_WINDOW_MS,
} from "@/lib/account/email-change";
import { documentText } from "@/lib/site/document";
import { HELP_GROUPS } from "@/lib/site/help-content";
import { PRIVACY_SECTIONS } from "@/lib/site/privacy-content";

const read = (path: string) => readFileSync(path, "utf8");

const action = read("app/(app)/account/security/email-action.ts");

const form = read("components/account/change-email-form.tsx");

const securityPage = read("app/(app)/account/security/page.tsx");

const profilePage = read("app/(app)/account/profile/page.tsx");

const events = read("lib/security/account-events.ts");

const validation = read("lib/validation/auth.ts");

const sessionSecurity = read("lib/auth/session-security.ts");

const workspaceActions = read("app/(app)/workspaces/actions.ts");

const schema = read("prisma/schema.prisma");

const readme = read("README.md");

/** Source text with every run of spaces and line breaks turned into one space. */
const flat = (text: string) => text.replace(/\s+/g, " ");

/** The place of each marker in the text, in the order they are given. */
function positions(text: string, markers: string[]): number[] {
  return markers.map((marker) => text.indexOf(marker));
}

/** True when every value was found and each one comes after the one before it. */
function isIncreasing(values: number[]): boolean {
  return values.every((value, index) => value > -1 && (index === 0 || value > values[index - 1]));
}

describe("change-email action", () => {
  it("is a server action file that exports nothing except the action", () => {
    expect(action.startsWith('"use server";')).toBe(true);

    const exported = Array.from(action.matchAll(/^export (.+)$/gm), (match) => match[1]);

    expect(exported).toEqual([
      "async function changeEmailAction(formData: FormData): Promise<void> {",
    ]);
  });

  it("checks the session, then the limit, then the form, then the password, then the database", () => {
    const order = positions(action, [
      "await requireCurrentUserIdentity()",
      "checkRateLimit(",
      'normalizeNewEmail(field(formData, "newEmail"))',
      'normalizeNewEmail(field(formData, "confirmEmail"))',
      "prisma.user.findUnique(",
      "const passwordMatches",
      "email-same",
      "const taken",
      "prisma.user.update(",
      'logAccountSecurityEvent("email.changed"',
      "await signOut(",
    ]);

    expect(isIncreasing(order)).toBe(true);
  });

  it("asks for the current password with bcrypt and refuses a wrong one", () => {
    expect(action).toContain('import { compare } from "bcryptjs";');

    expect(action).toContain('compare(field(formData, "password"), account.passwordHash)');

    const refused = action.slice(action.indexOf("if (passwordMatches === false)"));

    expect(refused.length).toBeLessThan(action.length);

    expect(refused.slice(0, 220)).toContain('back("email-password")');
  });

  it("asks for the new address twice and refuses two different ones", () => {
    expect(flat(action)).toContain("again.ok === false || again.email !== next.email");

    const mismatch = action.slice(action.indexOf("again.ok === false"));

    expect(mismatch.slice(0, 120)).toContain('back("email-mismatch")');
  });

  it("stops with the right message at each step", () => {
    const codeAfter = (condition: string) => {
      const start = action.indexOf(condition);

      return start === -1 ? undefined : /\bback\("([^"]+)"\)/.exec(action.slice(start))?.[1];
    };

    expect(codeAfter("if (attempts.allowed === false) {")).toBe("email-rate-limit");

    expect(codeAfter("if (next.ok === false) {")).toBe("email-invalid");

    expect(codeAfter("if (again.ok === false || again.email !== next.email) {")).toBe(
      "email-mismatch",
    );

    expect(codeAfter("if (passwordMatches === false) {")).toBe("email-password");

    expect(codeAfter("if (next.email === account.email.trim().toLowerCase()) {")).toBe(
      "email-same",
    );

    expect(codeAfter("if (taken !== null) {")).toBe("email-taken");

    const missing = action.indexOf("if (account === null) {");

    expect(missing).toBeGreaterThan(-1);

    expect(action.slice(missing, missing + 60)).toContain('redirect("/login")');
  });

  it("only ever changes the email address and the session version of this person", () => {
    const start = action.indexOf("prisma.user.update(");

    const end = action.indexOf("} catch (error)");

    expect(start).toBeGreaterThan(-1);

    expect(end).toBeGreaterThan(start);

    const update = action.slice(start, end);

    expect(update).toMatch(/where:\s*\{\s*id:\s*user\.id,?\s*\}/);

    expect(update).toContain("email: next.email");

    expect(update).toMatch(/authVersion:\s*\{\s*increment:\s*1,?\s*\}/);

    expect(update).not.toContain("passwordHash");

    expect(update).not.toContain("name:");
  });

  it("signs the person out of every session and sends them to the sign-in page", () => {
    expect(action).toMatch(
      /await signOut\(\{\s*redirectTo:\s*"\/login\?security=email-changed",?\s*\}\);/,
    );
  });

  it("slows down repeated tries of the same person", () => {
    expect(action).toContain("key: `email-change:${user.id}`");

    expect(action).toContain("limit: EMAIL_CHANGE_LIMIT");

    expect(action).toContain("windowMs: EMAIL_CHANGE_WINDOW_MS");

    expect(action).toContain('back("email-rate-limit")');
  });

  it("handles two people who choose the same address at the same moment", () => {
    const start = action.indexOf("} catch (error)");

    const end = action.indexOf('logAccountSecurityEvent("email.changed"');

    expect(start).toBeGreaterThan(-1);

    expect(end).toBeGreaterThan(start);

    const handler = action.slice(start, end);

    expect(handler).toContain("isUniqueViolation(error)");

    expect(handler).toContain('back("email-taken")');

    expect(handler).toContain("throw error;");
  });

  it("never logs an email address", () => {
    const calls = action.match(/logAccountSecurityEvent\([\s\S]*?\);/g) ?? [];

    expect(calls.length).toBe(5);

    for (const call of calls) {
      expect(call.replace(/"email\.[a-z.]+"/, "")).not.toMatch(/email/i);
    }

    const reasons = Array.from(action.matchAll(/reason: "([^"]+)"/g), (match) => match[1]);

    expect(reasons).toEqual(["rate-limit", "password", "taken", "taken"]);
  });

  it("puts only a fixed code into the address of the page, never the input", () => {
    const codes = Array.from(action.matchAll(/\bback\("([^"]+)"\)/g), (match) => match[1]);

    expect(Array.from(new Set(codes)).sort()).toEqual(Object.keys(EMAIL_CHANGE_MESSAGES).sort());

    const redirects = Array.from(action.matchAll(/\bredirect\(([^)]*)\)/g), (match) => match[1]);

    expect(redirects).toEqual(["`/account/security?status=${status}`", '"/login"']);

    expect(action).not.toContain("searchParams");
  });

  it("does not jump to another page inside the try block", () => {
    const start = action.indexOf("try {");

    const end = action.indexOf("} catch (error)");

    expect(start).toBeGreaterThan(-1);

    expect(end).toBeGreaterThan(start);

    const body = action.slice(start, end);

    expect(body).not.toContain("redirect(");

    expect(body).not.toContain("back(");

    expect(body).not.toContain("signOut(");
  });
});

describe("what the action relies on", () => {
  it("has a database rule that an email address can belong to only one account", () => {
    const user = /^model User \{([\s\S]*?)^\}/m.exec(schema);

    expect(user).not.toBe(null);

    expect(user?.[1]).toMatch(/^\s+email\s+String\s+@unique/m);
  });

  it("shares the email rules of sign-up and sign-in", () => {
    expect(validation).toContain("export const emailSchema = z");
  });

  it("ends every older session, because the version of the session is checked", () => {
    expect(sessionSecurity).toContain("isAuthVersionValid(");
  });

  it("matches invitations with the address of the signed-in person", () => {
    expect(flat(workspaceActions)).toContain("invitation.emailNormalized !== user.email");
  });
});

describe("change-email form", () => {
  it("posts to the action with the three fields that the action reads", () => {
    expect(form).toContain("action={changeEmailAction}");

    const fields = Array.from(action.matchAll(/field\(formData, "(\w+)"\)/g), (match) => match[1]);

    expect(Array.from(new Set(fields)).sort()).toEqual(["confirmEmail", "newEmail", "password"]);

    for (const name of fields) {
      expect(form).toContain(`name="${name}"`);
    }
  });

  it("uses email fields, a password field and the right browser hints", () => {
    expect(form.match(/type="email"/g)?.length).toBe(2);

    expect(form).toContain('autoComplete="email"');

    expect(form).toContain('autoComplete="current-password"');

    expect(form.match(/maxLength=\{EMAIL_MAX_LENGTH\}/g)?.length).toBe(2);

    expect(form.match(/\brequired\b/g)?.length).toBe(2);
  });

  it("tells the person that no message checks the address, and that they are signed out", () => {
    const text = flat(form);

    expect(text).toContain("sends no emails");

    expect(text).toContain("signs you out everywhere");

    expect(form).toContain('describedBy="email-change-note"');

    expect(form).toContain('id="email-change-note"');
  });

  it("needs no browser code of its own", () => {
    expect(form).not.toContain('"use client"');

    expect(form).not.toContain("useState");
  });
});

describe("pages", () => {
  it("shows the form on the Security page, above the password form", () => {
    expect(securityPage).toContain('<Card id="email"');

    expect(flat(securityPage)).toContain('currentEmail={session?.user?.email ?? ""}');

    expect(securityPage).toContain("...EMAIL_CHANGE_MESSAGES,");

    expect(
      isIncreasing(
        positions(securityPage, ["<ChangeEmailForm currentEmail=", "<ChangePasswordForm />"]),
      ),
    ).toBe(true);
  });

  it("links to the form from the Profile page, which no longer says the address is fixed", () => {
    expect(profilePage).toContain('href="/account/security#email"');

    expect(flat(profilePage)).not.toContain("cannot be changed from this page");
  });

  it("has the two log events", () => {
    expect(events).toContain('"email.changed"');

    expect(events).toContain('"email.change.rejected"');
  });
});

describe("texts", () => {
  const item = HELP_GROUPS.flatMap((group) => group.items).find(
    (candidate) => candidate.id === "change-email",
  );

  const help = item === undefined ? "" : item.answer.join(" ");

  it("explain in Help where to change the address and what happens next", () => {
    expect(item).not.toBeUndefined();

    expect(help).toContain("Account, then Profile");

    expect(help).toContain("Account, then Security");

    expect(help).toContain("Email address form");

    expect(help).toContain("twice");

    expect(help).toContain("signed out everywhere");

    expect(help).toContain("recovery key stays the same");

    expect(help).not.toContain("cannot be changed in the app");
  });

  it("tell the reader of the privacy notice that they can change the address themselves", () => {
    const privacy = documentText(PRIVACY_SECTIONS);

    expect(privacy).toContain("Change your email address or your password");

    expect(privacy).not.toContain("fixing an email address");
  });

  it("are the same in the README as in the code", () => {
    const text = flat(readme);

    expect(text).toContain("## Change your email address");

    expect(text).toContain(
      `${EMAIL_CHANGE_LIMIT} times every ${EMAIL_CHANGE_WINDOW_MS / 60_000} minutes`,
    );

    expect(text).toContain("Account, then Security, then Email address");
  });
});
