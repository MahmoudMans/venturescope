import { describe, expect, it } from "vitest";

import {
  NOT_FOUND_SEARCH_TIP,
  NOT_FOUND_SUGGESTION_LABEL,
  SUGGESTION_LIMIT,
  SUGGESTION_MAX_PATH_LENGTH,
  editDistance,
  normalizeRequestedPath,
  notFoundActions,
  notFoundCopy,
  suggestPages,
} from "@/lib/site/not-found-page";

const hrefs = (pathname: string, limit?: number) =>
  suggestPages(pathname, limit).map((page) => page.href);

describe("the words of the not-found pages", () => {
  it("uses plain words and no technical wording", () => {
    for (const area of ["app", "site"] as const) {
      const copy = notFoundCopy(area);

      expect(copy.title).toBe("We could not find that page");

      expect(copy.description.length).toBeGreaterThan(40);

      expect(`${copy.title} ${copy.description}`.toLowerCase()).not.toContain("resource");
    }
  });

  it("explains a typing mistake outside the app and a missing model inside it", () => {
    expect(notFoundCopy("site").description).toContain("typing mistake");

    expect(notFoundCopy("site").description).toContain("links below");

    expect(notFoundCopy("app").description).toContain("Check the address");

    expect(notFoundCopy("app").description).toContain("deleted");

    expect(notFoundCopy("app").description).toContain("stopped sharing");
  });

  it("sends a visitor home outside the app and to the dashboard inside it", () => {
    expect(notFoundActions("site").primary).toEqual({ href: "/", label: "Return home" });

    expect(notFoundActions("site").secondary).toEqual({
      href: "/dashboard",
      label: "Go to dashboard",
    });

    expect(notFoundActions("app").primary).toEqual({
      href: "/dashboard",
      label: "Go to dashboard",
    });

    expect(notFoundActions("app").secondary).toEqual({
      href: "/workspaces",
      label: "Open workspaces",
    });
  });

  it("has a short label for the guess and a tip about the search", () => {
    expect(NOT_FOUND_SUGGESTION_LABEL).toBe("Did you mean one of these?");

    expect(NOT_FOUND_SEARCH_TIP).toContain("search in the top bar");
  });
});

describe("normalizeRequestedPath", () => {
  it("removes the slashes, the query, the hash and the capital letters", () => {
    expect(normalizeRequestedPath("/Dashboard/")).toBe("dashboard");

    expect(normalizeRequestedPath("//help//faq?x=1#top")).toBe("help/faq");

    expect(normalizeRequestedPath("/help#top")).toBe("help");

    expect(normalizeRequestedPath("/help?x=1")).toBe("help");

    expect(normalizeRequestedPath("/")).toBe("");

    expect(normalizeRequestedPath("")).toBe("");
  });

  it("removes a file ending that people add by habit", () => {
    expect(normalizeRequestedPath("/login.php")).toBe("login");

    expect(normalizeRequestedPath("/privacy.html")).toBe("privacy");

    expect(normalizeRequestedPath("/terms.htm")).toBe("terms");

    expect(normalizeRequestedPath("/report.pdf")).toBe("report.pdf");
  });

  it("reads percent signs and keeps a broken one as typed", () => {
    expect(normalizeRequestedPath("/sign%2Din")).toBe("sign-in");

    expect(normalizeRequestedPath("/100%")).toBe("100%");
  });
});

describe("editDistance", () => {
  it("is zero for the same text", () => {
    expect(editDistance("", "")).toBe(0);

    expect(editDistance("help", "help")).toBe(0);
  });

  it("counts an added, removed or changed letter as one", () => {
    expect(editDistance("help", "hel")).toBe(1);

    expect(editDistance("hel", "help")).toBe(1);

    expect(editDistance("help", "helm")).toBe(1);
  });

  it("counts two swapped neighbour letters as one", () => {
    expect(editDistance("signin", "singin")).toBe(1);

    expect(editDistance("dashboard", "dashbaord")).toBe(1);
  });

  it("counts all letters when one text is empty", () => {
    expect(editDistance("", "terms")).toBe(5);

    expect(editDistance("terms", "")).toBe(5);
  });
});

describe("suggestPages", () => {
  it("guesses a page from a typing mistake", () => {
    expect(hrefs("/dashbord")).toEqual(["/dashboard"]);

    expect(hrefs("/dashboardd")).toEqual(["/dashboard"]);

    expect(hrefs("/dashbaord")).toEqual(["/dashboard"]);

    expect(hrefs("/wokspaces")).toEqual(["/workspaces"]);

    expect(hrefs("/privcy")).toEqual(["/privacy"]);

    expect(hrefs("/regsiter")).toEqual(["/register"]);
  });

  it("knows the words people use for a page", () => {
    expect(hrefs("/signin")).toEqual(["/login"]);

    expect(hrefs("/sign-in")).toEqual(["/login"]);

    expect(hrefs("/sign_up")).toEqual(["/register"]);

    expect(hrefs("/projects")).toEqual(["/dashboard"]);

    expect(hrefs("/faq")).toEqual(["/help"]);

    expect(hrefs("/reset-password")).toEqual(["/forgot-password"]);

    expect(hrefs("/privacy-policy")).toEqual(["/privacy"]);

    expect(hrefs("/terms-of-service")).toEqual(["/terms"]);

    expect(hrefs("/home")).toEqual(["/"]);
  });

  it("knows every page by its own name, with the right address and label", () => {
    const pages: [string, string, string][] = [
      ["dashboard", "/dashboard", "Dashboard"],
      ["projects/new", "/projects/new", "New model"],
      ["workspaces", "/workspaces", "Workspaces"],
      ["profile", "/account/profile", "Profile"],
      ["security", "/account/security", "Security"],
      ["login", "/login", "Sign in"],
      ["register", "/register", "Create account"],
      ["forgot-password", "/forgot-password", "Reset your password"],
      ["help", "/help", "Help center"],
      ["privacy", "/privacy", "Privacy"],
      ["terms", "/terms", "Terms"],
      ["demo", "/demo", "Live demo"],
      ["home", "/", "Home page"],
    ];

    for (const [word, href, label] of pages) {
      expect(
        suggestPages(`/${word}`).find((page) => page.href === href),
        word,
      ).toEqual({
        href,
        label,
      });
    }
  });

  it("knows every other word that people type for a page", () => {
    const words: [string, string][] = [
      ["models", "/dashboard"],
      ["app", "/dashboard"],
      ["new-model", "/projects/new"],
      ["new-project", "/projects/new"],
      ["create-model", "/projects/new"],
      ["create-project", "/projects/new"],
      ["workspace", "/workspaces"],
      ["team", "/workspaces"],
      ["teams", "/workspaces"],
      ["account", "/account/profile"],
      ["me", "/account/profile"],
      ["account", "/account/security"],
      ["password", "/account/security"],
      ["recovery", "/account/security"],
      ["recovery-key", "/account/security"],
      ["log-in", "/login"],
      ["logon", "/login"],
      ["signup", "/register"],
      ["join", "/register"],
      ["create-account", "/register"],
      ["reset-password", "/forgot-password"],
      ["forgot", "/forgot-password"],
      ["reset", "/forgot-password"],
      ["recover", "/forgot-password"],
      ["faq", "/help"],
      ["support", "/help"],
      ["contact", "/help"],
      ["docs", "/help"],
      ["privacy-policy", "/privacy"],
      ["terms-of-service", "/terms"],
      ["terms-and-conditions", "/terms"],
      ["tos", "/terms"],
      ["live-demo", "/demo"],
      ["sample", "/demo"],
      ["index", "/"],
      ["main", "/"],
    ];

    for (const [word, href] of words) {
      expect(hrefs(`/${word}`), word).toContain(href);
    }
  });

  it("does not mind dashes and underscores, even when there are several", () => {
    expect(hrefs("/sign--in")).toEqual(["/login"]);

    expect(hrefs("/sign__up")).toEqual(["/register"]);

    expect(hrefs("/sign_-in")).toEqual(["/login"]);
  });

  it("still finds a page with a dash in its name when the address also has a mistake", () => {
    expect(hrefs("/forgotpaswrod")).toEqual(["/forgot-password"]);

    expect(hrefs("/resetpaswrod")).toEqual(["/forgot-password"]);

    expect(hrefs("/termsofservce")).toEqual(["/terms"]);

    expect(hrefs("/termsandcondtions")).toEqual(["/terms"]);
  });

  it("offers both account pages for the word account", () => {
    expect(hrefs("/account")).toEqual(["/account/profile", "/account/security"]);
  });

  it("looks at the first part and the last part of a longer address", () => {
    expect(hrefs("/help/anything/here")).toEqual(["/help"]);

    expect(hrefs("/dashboard/oops")).toEqual(["/dashboard"]);

    expect(hrefs("/something/settings/login")).toEqual(["/login"]);
  });

  it("ignores capital letters, a final slash, a query and a file ending", () => {
    expect(hrefs("/Dashbord/")).toEqual(["/dashboard"]);

    expect(hrefs("/signin?next=%2Fdashboard")).toEqual(["/login"]);

    expect(hrefs("/login.php")).toEqual(["/login"]);

    expect(hrefs("/signin#top")).toEqual(["/login"]);
  });

  it("guesses the new model page from a mistyped path", () => {
    expect(hrefs("/project/new")).toContain("/projects/new");

    expect(hrefs("/projects/nwe")).toContain("/projects/new");
  });

  it("gives the label of each page", () => {
    expect(suggestPages("/signin")).toEqual([{ href: "/login", label: "Sign in" }]);

    expect(suggestPages("/dashbord")).toEqual([{ href: "/dashboard", label: "Dashboard" }]);
  });

  it("puts the closest page first", () => {
    const list = hrefs("/project/new");

    expect(list[0]).toBe("/dashboard");

    expect(list).toEqual(["/dashboard", "/projects/new"]);
  });

  it("gives no guess when nothing is close", () => {
    expect(hrefs("/pricing")).toEqual([]);

    expect(hrefs("/about")).toEqual([]);

    expect(hrefs("/hello")).toEqual([]);

    expect(hrefs("/xyz/abc/def")).toEqual([]);

    expect(hrefs("/hel")).toEqual(["/help"]);
  });

  it("needs an exact word for a very short name", () => {
    expect(hrefs("/tos")).toEqual(["/terms"]);

    expect(hrefs("/to")).toEqual([]);

    expect(hrefs("/tas")).toEqual([]);

    expect(hrefs("/me")).toEqual(["/account/profile"]);

    expect(hrefs("/mo")).toEqual([]);
  });

  it("gives no guess for the home address or an empty address", () => {
    expect(hrefs("/")).toEqual([]);

    expect(hrefs("")).toEqual([]);

    expect(hrefs("///")).toEqual([]);
  });

  it("gives no guess for a very long address", () => {
    expect(hrefs(`/${"a".repeat(SUGGESTION_MAX_PATH_LENGTH + 1)}`)).toEqual([]);

    expect(hrefs(`/help/${"a".repeat(SUGGESTION_MAX_PATH_LENGTH)}`)).toEqual([]);

    expect(hrefs(`/${"a".repeat(SUGGESTION_MAX_PATH_LENGTH - 5)}/help`)).toEqual(["/help"]);
  });

  it("offers at most three pages by default and respects a smaller limit", () => {
    expect(SUGGESTION_LIMIT).toBe(3);

    expect(hrefs("/account", 1)).toEqual(["/account/profile"]);

    expect(hrefs("/account", 0)).toEqual([]);

    expect(hrefs("/account", -1)).toEqual([]);

    expect(hrefs("/account/help/privacy/terms/demo")).toEqual([
      "/account/profile",
      "/account/security",
      "/demo",
    ]);

    expect(hrefs("/account/help/privacy/terms/demo", 2)).toEqual([
      "/account/profile",
      "/account/security",
    ]);
  });

  it("never repeats a page", () => {
    const list = hrefs("/account", 10);

    expect(new Set(list).size).toBe(list.length);
  });

  it("only offers addresses that start with a slash and have a label", () => {
    for (const path of ["/dashbord", "/signin", "/account", "/project/new", "/faq", "/home"]) {
      for (const page of suggestPages(path)) {
        expect(page.href.startsWith("/")).toBe(true);

        expect(page.label.length).toBeGreaterThan(2);
      }
    }
  });
});
