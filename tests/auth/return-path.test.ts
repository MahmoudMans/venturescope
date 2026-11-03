import { describe, expect, it } from "vitest";

import {
  DEFAULT_RETURN_PATH,
  RETURN_PATH_HEADER,
  authPageHref,
  describeLoginIntro,
  describeRegisterIntro,
  describeResetIntro,
  describeReturnTarget,
  safeReturnPath,
} from "@/lib/auth/return-path";

const TOKEN = "k3J9x_Qw-7Zr2LmN8pVb5TyHd1GcAeUfXsOi4WnRtYo";

const BASE = "http://example.test";

describe("constants", () => {
  it("sends a person to the dashboard when no other page was asked for", () => {
    expect(DEFAULT_RETURN_PATH).toBe("/dashboard");
  });

  it("uses a header name that every server accepts", () => {
    expect(RETURN_PATH_HEADER).toBe("x-venturescope-path");

    expect(RETURN_PATH_HEADER).toMatch(/^[a-z0-9-]+$/);
  });
});

describe("safeReturnPath", () => {
  it("keeps the pages of the app as they are", () => {
    for (const address of [
      "/dashboard",
      "/dashboard/",
      "/projects/new",
      "/projects/abc123/forecast",
      "/projects/p-1_2.3~4/overview",
      "/projects/abc123/settings?tab=sharing",
      "/projects/p?a=b%20c&d=e",
      "/workspaces",
      "/workspaces/w1?status=left",
      "/account/security",
      `/invite/${TOKEN}`,
    ]) {
      expect(safeReturnPath(address), address).toBe(address);
    }
  });

  it("refuses everything that is not a text", () => {
    for (const value of [undefined, null, 5, true, {}, ["/dashboard"], () => "/dashboard"]) {
      expect(safeReturnPath(value)).toBe(null);
    }
  });

  it("refuses an empty text and a text that is too long", () => {
    expect(safeReturnPath("")).toBe(null);

    expect(safeReturnPath(`/dashboard/${"a".repeat(389)}`)?.length).toBe(400);

    expect(safeReturnPath(`/dashboard/${"a".repeat(390)}`)).toBe(null);
  });

  it("refuses other websites and addresses that point away from the app", () => {
    for (const address of [
      "https://evil.example/dashboard",
      "http://evil.example",
      "//evil.example/dashboard",
      "///evil.example",
      "/\\evil.example",
      "\\\\evil.example",
      "javascript:alert(1)",
      "data:text/html,hello",
      "evil.example/dashboard",
      "dashboard",
    ]) {
      expect(safeReturnPath(address), address).toBe(null);
    }
  });

  it("refuses pages that a person cannot come back to", () => {
    for (const address of [
      "/",
      "/login",
      "/register",
      "/forgot-password",
      "/api/auth/signout",
      "/api/account/export",
      "/_next/static/chunk.js",
      "/demo",
      "/help",
      "/privacy",
      "/invite",
      "/invite/",
      "/dashboardx",
      "/Dashboard",
      "/projectsx/abc",
    ]) {
      expect(safeReturnPath(address), address).toBe(null);
    }
  });

  it("refuses an address that the browser would change", () => {
    for (const address of [
      "/projects/../login",
      "/projects/./overview",
      "/dashboard/..",
      "/projects/%2e%2e/login",
      "/projects/%2E%2E/login",
      "/projects/.%2e/overview",
      "/projects//abc",
      "/dashboard//",
    ]) {
      expect(safeReturnPath(address), address).toBe(null);
    }
  });

  it("refuses spaces, quotes, tags, line breaks and the part after a #", () => {
    for (const address of [
      "/dashboard x",
      '/dashboard"',
      "/dashboard'",
      "/dashboard<script>",
      "/dashboard?x=<a>",
      "/dashboard\n",
      "/dashboard\r\nSet-Cookie: a=b",
      "/dashboard\u0000",
      "/dashboard#top",
      "/dashboard;",
      "/dashboard\t",
      "/projects/p1;x",
      "/projects/p1?x=a;b",
      "/projects/p1?x=1#top",
      "/projects/p1?x=a b",
      "/projects/p1?x=a\\b",
      '/projects/p1?x="',
      "/projects/p1?x=<a>",
      "/projects/p1?x=a\nb",
    ]) {
      expect(safeReturnPath(address), JSON.stringify(address)).toBe(null);
    }
  });

  it("removes the _rsc part that Next.js adds to some addresses", () => {
    expect(safeReturnPath("/dashboard?_rsc=abc")).toBe("/dashboard");

    expect(safeReturnPath("/dashboard?_rsc")).toBe("/dashboard");

    expect(safeReturnPath("/projects/p1/forecast?scenario=bull&_rsc=1x2")).toBe(
      "/projects/p1/forecast?scenario=bull",
    );

    expect(safeReturnPath("/projects/p1?_rsc=a&x=1&_rsc=b")).toBe("/projects/p1?x=1");
  });

  it("does not leave an empty question mark or empty parts behind", () => {
    expect(safeReturnPath("/dashboard?")).toBe("/dashboard");

    expect(safeReturnPath("/dashboard?&&")).toBe("/dashboard");

    expect(safeReturnPath("/projects/p1?&a=1&")).toBe("/projects/p1?a=1");
  });

  it("removes only the _rsc name, not a name that starts with it", () => {
    expect(safeReturnPath("/dashboard?_rscx=1")).toBe("/dashboard?_rscx=1");
  });

  it("gives the same answer when it is used twice", () => {
    for (const address of [
      "/dashboard?_rsc=abc",
      "/projects/p1/forecast?scenario=bull&_rsc=1x2",
      `/invite/${TOKEN}`,
    ]) {
      const once = safeReturnPath(address);

      expect(safeReturnPath(once)).toBe(once);
    }
  });
});

describe("authPageHref", () => {
  it("is just the page when there is nothing to keep", () => {
    expect(authPageHref("/login")).toBe("/login");

    expect(authPageHref("/register")).toBe("/register");

    expect(authPageHref("/login", {})).toBe("/login");
  });

  it("keeps the security code, as before", () => {
    expect(authPageHref("/login", { security: "account-created" })).toBe(
      "/login?security=account-created",
    );

    expect(authPageHref("/login", { security: "account-created", next: null })).toBe(
      "/login?security=account-created",
    );
  });

  it("writes a security code that has special signs in a safe way", () => {
    expect(authPageHref("/login", { security: "a b&c" })).toBe("/login?security=a%20b%26c");
  });

  it("keeps the page that was asked for", () => {
    expect(authPageHref("/login", { next: `/invite/${TOKEN}` })).toBe(
      `/login?next=%2Finvite%2F${TOKEN}`,
    );

    expect(authPageHref("/register", { next: "/projects/p1/forecast" })).toBe(
      "/register?next=%2Fprojects%2Fp1%2Fforecast",
    );
  });

  it("puts the security code first and the page second", () => {
    expect(authPageHref("/login", { security: "account-created", next: `/invite/${TOKEN}` })).toBe(
      `/login?security=account-created&next=%2Finvite%2F${TOKEN}`,
    );
  });

  it("leaves out the dashboard, because everybody goes there anyway", () => {
    expect(authPageHref("/login", { next: "/dashboard" })).toBe("/login");

    expect(authPageHref("/login", { next: "/dashboard?_rsc=abc" })).toBe("/login");
  });

  it("drops an address that is not a page of the app", () => {
    for (const next of [
      "https://evil.example",
      "//evil.example",
      "/login",
      "/api/auth/signout",
      null,
      undefined,
      5,
    ]) {
      expect(authPageHref("/login", { next }), String(next)).toBe("/login");
    }
  });

  it("writes a question mark and an ampersand of the page in a way that can be read back", () => {
    const href = authPageHref("/login", { next: "/projects/p1?a=1&b=2" });

    expect(href).toBe("/login?next=%2Fprojects%2Fp1%3Fa%3D1%26b%3D2");

    expect(new URL(href, BASE).searchParams.get("next")).toBe("/projects/p1?a=1&b=2");
  });

  it("keeps the page for the reset page as well", () => {
    expect(authPageHref("/forgot-password")).toBe("/forgot-password");

    expect(authPageHref("/forgot-password", { next: `/invite/${TOKEN}` })).toBe(
      `/forgot-password?next=%2Finvite%2F${TOKEN}`,
    );

    expect(authPageHref("/forgot-password", { next: "/dashboard" })).toBe("/forgot-password");

    expect(authPageHref("/forgot-password", { next: "https://evil.example" })).toBe(
      "/forgot-password",
    );
  });

  it("keeps an invitation from the first page to the last one", () => {
    const invite = `/invite/${TOKEN}`;

    // 1. The invitation page sends a signed-out person to the sign-in page.
    const login = authPageHref("/login", { next: invite });

    // 2. The person chooses "Create one".
    const next = new URL(login, BASE).searchParams.get("next");

    const register = authPageHref("/register", { next });

    // 3. The create-account form sends its hidden "next" field to the action.
    const hidden = new URL(register, BASE).searchParams.get("next");

    const afterRegister = new URL(
      authPageHref("/login", { security: "account-created", next: hidden }),
      BASE,
    );

    expect(afterRegister.searchParams.get("security")).toBe("account-created");

    // 4. The sign-in form sends the same hidden field, and the action reads it.
    expect(safeReturnPath(afterRegister.searchParams.get("next"))).toBe(invite);
  });
});

describe("describeReturnTarget", () => {
  it("says nothing when there is no page", () => {
    expect(describeReturnTarget(null)).toBe(null);
  });

  it("names the page in a few simple words", () => {
    expect(describeReturnTarget(`/invite/${TOKEN}`)).toBe("your workspace invitation");

    expect(describeReturnTarget("/projects/new")).toBe("the new model page");

    expect(describeReturnTarget("/projects/p1/forecast?a=1")).toBe("your financial model");

    expect(describeReturnTarget("/workspaces")).toBe("your workspaces");

    expect(describeReturnTarget("/workspaces/")).toBe("your workspaces");

    expect(describeReturnTarget("/workspaces/w1")).toBe("your workspace");

    expect(describeReturnTarget("/account/security")).toBe("your account");

    expect(describeReturnTarget("/dashboard")).toBe("your dashboard");
  });
});

describe("sign-in and create-account lines", () => {
  it("keep the old lines when no page was asked for", () => {
    expect(describeLoginIntro(null)).toBe("Sign in to continue to your VentureScope workspace.");

    expect(describeRegisterIntro(null)).toBe(
      "Start building financial models and scenario forecasts.",
    );
  });

  it("tell a person what they will open", () => {
    expect(describeLoginIntro(`/invite/${TOKEN}`)).toBe(
      "Sign in to open your workspace invitation.",
    );

    expect(describeLoginIntro("/projects/p1/forecast")).toBe(
      "Sign in to open your financial model.",
    );

    expect(describeRegisterIntro("/workspaces/w1")).toBe(
      "Create your account, then sign in to open your workspace.",
    );
  });

  it("tell a person who forgot the password what they need, and what comes after", () => {
    const base = describeResetIntro(null);

    expect(base).toContain("VentureScope sends no emails");

    expect(base).toContain("recovery key");

    expect(base).toContain("Account, then Security");

    expect(base).not.toContain("After the reset");

    expect(describeResetIntro(`/invite/${TOKEN}`)).toBe(
      `${base} After the reset, sign in to open your workspace invitation.`,
    );

    expect(describeResetIntro("/projects/p1/forecast")).toContain("your financial model");
  });

  it("tell a new person to use the invited email address", () => {
    const line = describeRegisterIntro(`/invite/${TOKEN}`);

    expect(line).toContain("email address that was invited");

    expect(line).toContain("back to your invitation");
  });
});
