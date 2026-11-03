import { describe, expect, it } from "vitest";

import {
  ERROR_REFERENCE_HINT,
  ERROR_REFERENCE_MAX_LENGTH,
  errorPageCopy,
  errorReference,
  resolveDarkTheme,
} from "@/lib/site/error-page";

describe("errorReference", () => {
  it("returns the digest that Next.js adds to a server error", () => {
    expect(errorReference({ digest: "2378127318" })).toBe("2378127318");

    expect(errorReference(Object.assign(new Error("failed"), { digest: "abc_DEF-1.2" }))).toBe(
      "abc_DEF-1.2",
    );
  });

  it("removes spaces around the digest", () => {
    expect(errorReference({ digest: "  42  " })).toBe("42");
  });

  it("returns null when there is no usable digest", () => {
    for (const value of [
      undefined,
      null,
      "text",
      42,
      true,
      [],
      {},
      new Error("failed"),
      { digest: undefined },
      { digest: null },
      { digest: 42 },
      { digest: ["1"] },
      { digest: "" },
      { digest: "   " },
    ]) {
      expect(errorReference(value), String(value)).toBe(null);
    }
  });

  it("accepts the longest reference and refuses a longer one", () => {
    expect(ERROR_REFERENCE_MAX_LENGTH).toBe(64);

    expect(errorReference({ digest: "a".repeat(64) })).toBe("a".repeat(64));

    expect(errorReference({ digest: "a".repeat(65) })).toBe(null);
  });

  it("refuses a code with signs that could be used to show something else", () => {
    for (const digest of [
      "<script>alert(1)</script>",
      "a b",
      "a/b",
      "a\nb",
      "ab\u00e9",
      "'quoted'",
      "a;b",
      "a=b",
    ]) {
      expect(errorReference({ digest }), digest).toBe(null);
    }
  });

  it("never uses the message of the error", () => {
    const error = Object.assign(new Error("password=secret at /srv/app/db.ts"), { digest: "77" });

    expect(errorReference(error)).toBe("77");

    expect(errorReference(new Error("password=secret"))).toBe(null);
  });
});

describe("errorPageCopy", () => {
  it("sends a signed-in person to the dashboard and everybody else home", () => {
    expect(errorPageCopy("app").homeHref).toBe("/dashboard");

    expect(errorPageCopy("app").homeLabel).toBe("Go to dashboard");

    for (const area of ["site", "global"] as const) {
      expect(errorPageCopy(area).homeHref, area).toBe("/");

      expect(errorPageCopy(area).homeLabel, area).toBe("Return home");
    }
  });

  it("uses the same title for a page that failed, and its own title for a failed start", () => {
    expect(errorPageCopy("app").title).toBe("This page could not load");

    expect(errorPageCopy("site").title).toBe("This page could not load");

    expect(errorPageCopy("global").title).toBe("VentureScope could not start");
  });

  it("has plain full sentences without technical words", () => {
    for (const area of ["app", "site", "global"] as const) {
      const { title, description } = errorPageCopy(area);

      expect(description.endsWith("."), area).toBe(true);

      expect(description.length, area).toBeGreaterThan(40);

      expect(title.trim(), area).toBe(title);

      expect(`${title} ${description}`.toLowerCase(), area).not.toMatch(
        /stack|exception|database|500|undefined|null/,
      );
    }
  });

  it("points the way back in the words of each area", () => {
    expect(errorPageCopy("app").description).toContain("go back to your dashboard");

    expect(errorPageCopy("site").description).toContain("go back to the home page");

    expect(errorPageCopy("global").description).toContain("come back in a few minutes");
  });

  it("promises that data is safe only inside the app, where it is true", () => {
    expect(errorPageCopy("app").description).toContain("Your data is safe");

    expect(errorPageCopy("site").description).not.toContain("data");

    expect(errorPageCopy("global").description).not.toContain("data");
  });
});

describe("ERROR_REFERENCE_HINT", () => {
  it("tells what to do with the reference", () => {
    expect(ERROR_REFERENCE_HINT).toContain("reference");

    expect(ERROR_REFERENCE_HINT).toContain("person who runs this VentureScope service");

    expect(ERROR_REFERENCE_HINT.endsWith(".")).toBe(true);
  });
});

describe("resolveDarkTheme", () => {
  it("follows the saved choice first", () => {
    expect(resolveDarkTheme("dark", false)).toBe(true);

    expect(resolveDarkTheme("light", true)).toBe(false);
  });

  it("follows the system when the choice is system, missing or unknown", () => {
    for (const stored of ["system", "", "blue", null]) {
      expect(resolveDarkTheme(stored, true), String(stored)).toBe(true);

      expect(resolveDarkTheme(stored, false), String(stored)).toBe(false);
    }
  });
});
