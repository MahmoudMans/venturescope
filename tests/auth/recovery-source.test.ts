import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { getLoginNotice } from "@/lib/auth/login-notices";

const reset = readFileSync("app/(auth)/forgot-password/actions.ts", "utf8");

const resetPage = readFileSync("app/(auth)/forgot-password/page.tsx", "utf8");

const reveal = readFileSync("app/(app)/account/security/recovery-actions.ts", "utf8");

const securityPage = readFileSync("app/(app)/account/security/page.tsx", "utf8");

const loginForm = readFileSync("components/auth/login-form.tsx", "utf8");

const register = readFileSync("app/(auth)/register/actions.ts", "utf8");

const proxy = readFileSync("proxy.ts", "utf8");

const keySource = readFileSync("lib/auth/recovery-key.ts", "utf8");

const readme = readFileSync("README.md", "utf8");

describe("password reset action", () => {
  it("is a server action that limits how often a person can try", () => {
    expect(reset).toContain('"use server"');

    expect(reset).toContain("checkRateLimit({");

    expect(reset).toMatch(/recovery-reset:\$\{checked\.data\.email\}/);

    expect(reset).toContain("attempts.allowed === false");
  });

  it("checks the recovery key against the stored password hash", () => {
    expect(reset).toContain("recoveryKeyMatches(");

    expect(reset).toContain("passwordHash: true");
  });

  it("gives the same answer for an unknown email and a wrong key", () => {
    expect(reset).toContain("user === null || keyMatches === false");

    expect(reset.match(/MISMATCH_MESSAGE/g)?.length ?? 0).toBeGreaterThanOrEqual(3);

    expect(reset).not.toMatch(/no account|not found|does not exist/i);
  });

  it("changes the password in one guarded update that also signs everyone out", () => {
    expect(reset).toContain("updateMany");

    expect(reset).toContain("passwordHash: user.passwordHash");

    expect(reset).toContain("increment: 1");

    expect(reset).toContain("passwordChangedAt");

    expect(reset).toContain("updated.count !== 1");
  });

  it("hashes the new password the same way as the rest of the app", () => {
    expect(reset).toContain("hash(checked.data.newPassword, 12)");
  });

  it("redirects outside of any try block and never logs secrets", () => {
    expect(reset).not.toContain("try {");

    expect(reset).toContain('authPageHref("/login", {');

    expect(reset).toContain('security: "password-reset"');

    expect(reset).not.toMatch(/logRecoveryEvent\([^)]*\b(email|recoveryKey|newPassword)\s*:/);
  });
});

describe("recovery key source", () => {
  it("compares keys in constant time and stores nothing", () => {
    expect(keySource).toContain("timingSafeEqual(");

    expect(keySource).not.toContain("prisma");
  });
});

describe("recovery key reveal action", () => {
  it("needs a signed-in person and their current password", () => {
    expect(reveal).toContain("requireUser()");

    expect(reveal).toContain("compare(password, account.passwordHash)");

    expect(reveal).toContain("passwordMatches === false");
  });

  it("limits how often a person can try", () => {
    expect(reveal).toContain("checkRateLimit({");

    expect(reveal).toMatch(/recovery-reveal:\$\{user\.id\}/);

    expect(reveal).toContain("attempts.allowed === false");
  });

  it("only returns the key after the password check", () => {
    const check = reveal.indexOf("passwordMatches === false");

    const answer = reveal.indexOf("formatRecoveryKey(");

    expect(check).toBeGreaterThan(-1);

    expect(answer).toBeGreaterThan(check);
  });
});

describe("recovery pages", () => {
  it("keeps the reset page out of search results and sends signed-in people away", () => {
    expect(resetPage).toContain("index: false");

    expect(resetPage).toContain('redirect("/account/security")');
  });

  it("shows the recovery key form on the security page", () => {
    expect(securityPage).toContain("<RecoveryKeyForm />");

    expect(securityPage).toContain("Recovery key");
  });

  it("links the login page to the reset page instead of promising it for later", () => {
    expect(loginForm).toContain('authPageHref("/forgot-password", { next: returnTo })');

    expect(loginForm).not.toContain("comes later");
  });

  it("limits reset requests per client in the proxy", () => {
    const block = proxy.indexOf('"/forgot-password"');

    expect(block).toBeGreaterThan(-1);

    expect(proxy.slice(block, block + 400)).toContain("checkRateLimit");
  });

  it("tells new people about the recovery key", () => {
    expect(register).toContain('authPageHref("/login", {');

    expect(register).toContain('security: "account-created"');

    expect(getLoginNotice("account-created")?.message).toContain("recovery key");

    expect(getLoginNotice("password-reset")?.title).toBe("Password reset");

    expect(getLoginNotice("password-reset")?.tone).toBe("success");
  });

  it("is explained in the README", () => {
    expect(readme).toContain("Password recovery");

    expect(readme).toContain("AUTH_SECRET");
  });
});
