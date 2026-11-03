import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { documentText } from "@/lib/site/document";
import { PRIVACY_INTRO, PRIVACY_SECTIONS } from "@/lib/site/privacy-content";
import { getSupportEmail, parseSupportEmail } from "@/lib/site/support";
import { TERMS_INTRO, TERMS_SECTIONS } from "@/lib/site/terms-content";

const documents = [
  { name: "privacy notice", intro: PRIVACY_INTRO, sections: PRIVACY_SECTIONS },
  { name: "terms", intro: TERMS_INTRO, sections: TERMS_SECTIONS },
];

const privacy = documentText(PRIVACY_SECTIONS);

const terms = documentText(TERMS_SECTIONS);

const manifest = JSON.parse(readFileSync("package.json", "utf8")) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const installed = Object.keys({
  ...manifest.dependencies,
  ...manifest.devDependencies,
});

describe("documentText", () => {
  it("joins titles, paragraphs and bullets", () => {
    expect(
      documentText([
        { id: "a", title: "Title A", paragraphs: ["One."], bullets: ["Two."] },
        { id: "b", title: "Title B" },
      ]),
    ).toBe("Title A One. Two. Title B");
  });
});

for (const { name, intro, sections } of documents) {
  describe(name, () => {
    it("has an introduction and several sections", () => {
      expect(intro.length).toBeGreaterThan(40);

      expect(sections.length).toBeGreaterThanOrEqual(8);
    });

    it("gives every section its own id for the table of contents", () => {
      const ids = sections.map((section) => section.id);

      expect(new Set(ids).size).toBe(ids.length);

      expect(ids.includes("contact")).toBe(false);

      for (const id of ids) {
        expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      }
    });

    it("puts real text in every section", () => {
      for (const section of sections) {
        expect(section.title.length).toBeGreaterThan(3);

        const parts = [...(section.paragraphs ?? []), ...(section.bullets ?? [])];

        expect(parts.length).toBeGreaterThan(0);

        for (const part of parts) {
          expect(part).toBe(part.trim());

          expect(part.length).toBeGreaterThan(10);
        }
      }
    });

    it("has no placeholder text left in it", () => {
      const text = `${intro} ${documentText(sections)}`;

      expect(text).not.toMatch(/\[[^\]]+\]|lorem|todo|tbd|xxx|your company/i);
    });
  });
}

describe("privacy notice matches what the app does", () => {
  it("says the session lasts as long as the sign-in settings say", () => {
    expect(readFileSync("auth.ts", "utf8")).toContain("maxAge: 30 * 24 * 60 * 60");

    expect(privacy).toContain("30 days");
  });

  it("says passwords are hashed, and the sign-up code really hashes them", () => {
    expect(privacy).toContain("one-way hash");

    expect(readFileSync("app/(auth)/register/actions.ts", "utf8")).toContain("hash(");
  });

  it("says no IP address is saved, and the database has no column for one", () => {
    expect(privacy).toContain("It is not saved in the database");

    expect(readFileSync("prisma/schema.prisma", "utf8")).not.toMatch(/\bip(Address)?\b/i);
  });

  it("says there is no analytics, advertising, payment or email service", () => {
    expect(privacy).toContain("no analytics");

    const outsideServices =
      /^(@sentry\/|@vercel\/analytics|@segment\/|@next\/third-parties|@stripe\/|@sendgrid\/|@aws-sdk\/client-ses|react-ga|posthog|mixpanel|amplitude|hotjar|plausible|stripe|nodemailer|mailgun|postmark|resend)/i;

    expect(installed.filter((name) => outsideServices.test(name))).toEqual([]);
  });

  it("explains how to delete an account, and that page exists", () => {
    expect(privacy).toContain("Account, then Security");

    expect(existsSync("app/(app)/account/security/page.tsx")).toBe(true);
  });

  it("describes the data download, and the page and the route for it exist", () => {
    expect(privacy).toContain(
      "Download a copy of your data in one ZIP file in Account, then Profile",
    );

    expect(privacy).toContain("is not kept on our servers");

    expect(privacy).toContain("getting records that are not in the download");

    expect(existsSync("app/(app)/account/profile/page.tsx")).toBe(true);

    expect(existsSync("app/api/account/export/route.ts")).toBe(true);
  });

  it("opens with a short summary of the main promises", () => {
    const summary = documentText(PRIVACY_SECTIONS.slice(0, 1));

    expect(PRIVACY_SECTIONS[0]?.id).toBe("the-short-version");

    expect(summary).toContain("one-way hash");

    expect(summary).toContain("no analytics");

    expect(summary).toContain("sends no emails");
  });

  it("names the browser storage it uses", () => {
    expect(privacy).toContain("session cookie");

    expect(privacy).toContain("theme");
  });
});

describe("terms match what the app does", () => {
  it("tells people that a lost recovery key cannot be replaced", () => {
    expect(terms).toContain("recovery key");

    expect(terms).toContain("we cannot recover the account");
  });

  it("says forecasts are estimates and not advice", () => {
    expect(terms).toContain("It is not a promise of results");

    expect(terms).toContain("not financial, tax, legal or investment advice");
  });

  it("points to the sign-in limits and the delete option", () => {
    expect(terms).toContain("limits on sign-in attempts");

    expect(terms).toContain("Account, then Security");
  });
});

describe("support email", () => {
  it("accepts a normal address and trims it", () => {
    expect(parseSupportEmail("help@example.com")).toBe("help@example.com");

    expect(parseSupportEmail("  help@example.com  ")).toBe("help@example.com");
  });

  it("ignores a missing or wrong value", () => {
    expect(parseSupportEmail(undefined)).toBeNull();

    expect(parseSupportEmail("")).toBeNull();

    expect(parseSupportEmail("   ")).toBeNull();

    expect(parseSupportEmail("not an email")).toBeNull();

    expect(parseSupportEmail("help@@example.com")).toBeNull();
  });

  it("reads the setting from the environment", () => {
    const original = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

    try {
      process.env.NEXT_PUBLIC_SUPPORT_EMAIL = "team@example.com";

      expect(getSupportEmail()).toBe("team@example.com");

      process.env.NEXT_PUBLIC_SUPPORT_EMAIL = "broken";

      expect(getSupportEmail()).toBeNull();

      delete process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

      expect(getSupportEmail()).toBeNull();
    } finally {
      if (original === undefined) {
        delete process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
      } else {
        process.env.NEXT_PUBLIC_SUPPORT_EMAIL = original;
      }
    }
  });
});
