import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { HELP_GROUPS } from "@/lib/site/help-content";

const read = (path: string) => readFileSync(path, "utf8");

const proxy = read("proxy.ts");

const requestPath = read("lib/auth/request-path.ts");

const requireUser = read("lib/auth/require-user.ts");

const currentUser = read("lib/auth/current-user.ts");

const loginPage = read("app/(auth)/login/page.tsx");

const loginForm = read("components/auth/login-form.tsx");

const loginAction = read("app/(auth)/login/actions.ts");

const registerPage = read("app/(auth)/register/page.tsx");

const registerForm = read("components/auth/register-form.tsx");

const registerAction = read("app/(auth)/register/actions.ts");

const invitePage = read("app/(app)/invite/[token]/page.tsx");

const switchAction = read("app/(app)/invite/switch-account-action.ts");

const readme = read("README.md");

/**
 * The text without spaces, line breaks and trailing commas, so the checks do
 * not depend on how the code is laid out.
 */
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

describe("proxy", () => {
  it("takes the helper from the one place that checks addresses", () => {
    expect(
      has(proxy, 'import { RETURN_PATH_HEADER, safeReturnPath, } from "@/lib/auth/return-path";'),
    ).toBe(true);
  });

  it("removes what the browser sent, checks the asked page, and sets the header only when it is good", () => {
    expect(
      isIncreasing(
        positions(proxy, [
          "const forwardedRequestHeaders = new Headers(",
          "forwardedRequestHeaders.delete( RETURN_PATH_HEADER, );",
          "const askedPage = safeReturnPath(",
          "${request.nextUrl.pathname}${request.nextUrl.search}",
          "if ( askedPage !== null ) {",
          "forwardedRequestHeaders.set( RETURN_PATH_HEADER, askedPage, );",
          "const continueWithCorrelationId =",
        ]),
      ),
    ).toBe(true);
  });

  it("puts the header on the request for the pages, never on the answer to the browser", () => {
    expect(has(proxy, "request: { headers: forwardedRequestHeaders, }")).toBe(true);

    expect(has(proxy, "response.headers.set( RETURN_PATH_HEADER")).toBe(false);
  });

  it("still sends the request id the way it did", () => {
    expect(has(proxy, 'forwardedRequestHeaders.set( "x-request-id", correlationId, );')).toBe(true);
  });
});

describe("sign-in redirect", () => {
  it("reads the asked page from the request header and keeps the framework signals", () => {
    expect(has(requestPath, 'import { headers } from "next/headers";')).toBe(true);

    expect(has(requestPath, "const requestHeaders = await headers();")).toBe(true);

    expect(has(requestPath, "next: requestHeaders.get(RETURN_PATH_HEADER)")).toBe(true);

    expect(has(requestPath, 'return authPageHref("/login", {')).toBe(true);

    // A try block here could hide the error that Next.js uses to mark a page as dynamic.
    expect(requestPath).not.toContain("catch");

    expect(requestPath).not.toContain("try {");
  });

  it("is used by both ways to require a person", () => {
    expect(has(requireUser, "redirect(await loginAddressForRequest());")).toBe(true);

    expect(requireUser).not.toContain('redirect("/login")');

    expect(currentUser.match(/redirect\(\s*await loginAddressForRequest\(\),?\s*\)/g)?.length).toBe(
      2,
    );

    expect(currentUser).not.toContain('"/login"');
  });
});

describe("sign-in page", () => {
  it("opens the asked page for a person who is already signed in", () => {
    expect(
      isIncreasing(
        positions(loginPage, [
          "const { security, next } = await searchParams;",
          "const returnTo = safeReturnPath(next);",
          "redirect(returnTo ?? DEFAULT_RETURN_PATH);",
          "<LoginForm notice={getLoginNotice(security)} returnTo={returnTo} />",
        ]),
      ),
    ).toBe(true);
  });

  it("sends the asked page with the form, but only when there is one", () => {
    expect(
      has(loginForm, '{returnTo ? <input type="hidden" name="next" value={returnTo} /> : null}'),
    ).toBe(true);

    expect(
      has(loginForm, "<CardDescription>{describeLoginIntro(returnTo)}</CardDescription>"),
    ).toBe(true);
  });

  it("keeps the asked page when the person goes to create an account", () => {
    expect(has(loginForm, 'href={authPageHref("/register", { next: returnTo })}')).toBe(true);
  });

  it("signs in to the asked page, and to the dashboard for any other address", () => {
    expect(
      isIncreasing(
        positions(loginAction, [
          'const returnTo = safeReturnPath(formData.get("next")) ?? DEFAULT_RETURN_PATH;',
          "await signIn(",
          "redirectTo: returnTo",
        ]),
      ),
    ).toBe(true);

    expect(loginAction).not.toContain('redirectTo: "/dashboard"');
  });
});

describe("create-account page", () => {
  it("opens the asked page for a person who is already signed in", () => {
    expect(
      isIncreasing(
        positions(registerPage, [
          "const { next } = await searchParams;",
          "const returnTo = safeReturnPath(next);",
          "redirect(returnTo ?? DEFAULT_RETURN_PATH);",
          "<RegisterForm returnTo={returnTo} />",
        ]),
      ),
    ).toBe(true);
  });

  it("sends the asked page with the form, and keeps it when the person goes to sign in", () => {
    expect(
      has(registerForm, '{returnTo ? <input type="hidden" name="next" value={returnTo} /> : null}'),
    ).toBe(true);

    expect(has(registerForm, "{describeRegisterIntro(returnTo)}")).toBe(true);

    expect(has(registerForm, 'href={authPageHref("/login", { next: returnTo })}')).toBe(true);
  });

  it("brings the asked page to the sign-in page after the account was created", () => {
    expect(
      isIncreasing(
        positions(registerAction, [
          "await prisma.user.create(",
          'authPageHref("/login", {',
          'security: "account-created",',
          'next: formData.get("next")',
        ]),
      ),
    ).toBe(true);

    expect(registerAction).not.toContain('redirect("/login?security=account-created")');
  });
});

describe("invitation page", () => {
  it("lets a person who is signed in with another address sign out and come back", () => {
    expect(
      isIncreasing(
        positions(invitePage, [
          "{emailMatches ? (",
          "action={acceptWorkspaceInvitationAction}",
          ") : (",
          "action={switchInvitationAccountAction}",
          "Sign out and use another account",
        ]),
      ),
    ).toBe(true);

    // The second form carries the token too, so the action can build the way back.
    const second = invitePage.slice(invitePage.indexOf("action={switchInvitationAccountAction}"));

    expect(has(second, '<input type="hidden" name="token" value={token} />')).toBe(true);

    expect(
      has(invitePage, 'import { switchInvitationAccountAction } from "../switch-account-action";'),
    ).toBe(true);
  });

  it("tells the person what to do in simple words", () => {
    expect(
      has(
        invitePage,
        "Sign out, then sign in or create an account with the invited address to accept it.",
      ),
    ).toBe(true);
  });

  it("still lets the right person accept", () => {
    expect(has(invitePage, "Accept invitation")).toBe(true);

    expect(has(invitePage, "<form action={acceptWorkspaceInvitationAction}")).toBe(true);
  });
});

describe("switch account action", () => {
  it("is a server action", () => {
    expect(switchAction.startsWith('"use server";')).toBe(true);
  });

  it("accepts only a token of the shape that VentureScope creates, and builds the address itself", () => {
    expect(has(switchAction, "/^[A-Za-z0-9_-]{16,128}$/.test(token)")).toBe(true);

    expect(has(switchAction, "`/invite/${token}`")).toBe(true);

    expect(switchAction.match(/\/invite\//g)?.length).toBe(1);
  });

  it("signs out and ends there", () => {
    expect(
      has(
        switchAction,
        'await signOut({ redirectTo: authPageHref("/login", { next: target }), }); }',
      ),
    ).toBe(true);

    expect(switchAction).not.toContain("redirect(");
  });
});

describe("Help", () => {
  const items = HELP_GROUPS.flatMap((group) => group.items);

  const item = items.find((candidate) => candidate.id === "invitations");

  it("tells what happens when the person is not signed in", () => {
    const text = (item?.answer ?? []).join(" ");

    expect(text).toContain("brings them back to the invitation after they sign in");

    expect(text).toContain("choose Create one, register with the invited address");

    expect(text).toContain("button to sign out and use another account");
  });

  it("still says how long the link works and what to do for a collaborator", () => {
    const text = (item?.answer ?? []).join(" ");

    expect(text).toContain("7 days");

    expect(text).toContain("already a collaborator");

    expect(item?.answer).toHaveLength(4);
  });
});

describe("README", () => {
  it("has a section about coming back to the page", () => {
    const start = readme.indexOf("## Come back to the page you asked for");

    expect(start).toBeGreaterThan(-1);

    const next = readme.indexOf("\n## ", start + 1);

    expect(next).toBeGreaterThan(start);

    const text = readme.slice(start, next).replace(/\s+/g, " ");

    expect(text).toContain("invitation links");

    expect(text).toContain("x-venturescope-path");

    expect(text).toContain("removes any value that the browser sent itself");

    expect(text).toContain("Sign out and use another account");

    expect(text).toContain("Forgot password");
  });
});
