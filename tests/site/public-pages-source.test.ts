import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  INFO_PAGES_UPDATED,
  INFO_PAGES_UPDATED_ISO,
  PUBLIC_INFO_LINKS,
} from "@/lib/site/public-pages";

const read = (path: string) => readFileSync(path, "utf8");

const pages = {
  "/help": read("app/(marketing)/help/page.tsx"),
  "/privacy": read("app/(marketing)/privacy/page.tsx"),
  "/terms": read("app/(marketing)/terms/page.tsx"),
};

const shell = read("components/site/public-page-shell.tsx");

const documentPage = read("components/site/document-page.tsx");

const helpCenter = read("components/site/help-center.tsx");

const contactNote = read("components/site/contact-note.tsx");

const home = read("app/(marketing)/page.tsx");

const register = read("components/auth/register-form.tsx");

const appLayout = read("app/(app)/layout.tsx");

const sitemap = read("app/sitemap.ts");

const robots = read("app/robots.ts");

const readme = read("README.md");

describe("public page list", () => {
  it("links to Help, Privacy and Terms, and each page exists", () => {
    expect(PUBLIC_INFO_LINKS.map((link) => link.href)).toEqual(["/help", "/privacy", "/terms"]);

    for (const link of PUBLIC_INFO_LINKS) {
      expect(existsSync(`app/(marketing)${link.href}/page.tsx`)).toBe(true);

      expect(link.label.length).toBeGreaterThan(3);

      expect(link.description.length).toBeGreaterThan(10);
    }
  });

  it("has a real date for the last update", () => {
    expect(INFO_PAGES_UPDATED_ISO).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const date = new Date(`${INFO_PAGES_UPDATED_ISO}T00:00:00Z`);

    expect(Number.isNaN(date.getTime())).toBe(false);

    expect(INFO_PAGES_UPDATED).toContain(String(date.getUTCFullYear()));
  });
});

describe("the three pages", () => {
  it("can be found by search engines and have their own title and address", () => {
    for (const [href, source] of Object.entries(pages)) {
      expect(source).not.toContain("index: false");

      expect(source).toContain("title:");

      expect(source).toContain("description");

      expect(source).toContain(`canonical: "${href}"`);

      expect(source).toContain("<PublicPageShell>");
    }
  });

  it("read the optional support address on the server", () => {
    for (const source of Object.values(pages)) {
      expect(source).toContain("getSupportEmail()");
    }
  });

  it("show the legal texts through the shared document page", () => {
    expect(pages["/privacy"]).toContain("<DocumentPage");

    expect(pages["/privacy"]).toContain("PRIVACY_SECTIONS");

    expect(pages["/terms"]).toContain("<DocumentPage");

    expect(pages["/terms"]).toContain("TERMS_SECTIONS");

    expect(pages["/help"]).toContain("<HelpCenter");
  });
});

describe("page shell", () => {
  it("has a header with sign-in links and a footer with the three pages", () => {
    expect(shell).toContain('href="/login"');

    expect(shell).toContain('href="/register"');

    expect(shell).toContain('href="/help"');

    expect(shell).toContain("<PublicFooterLinks />");

    expect(shell).toContain("PUBLIC_INFO_LINKS.map");
  });

  it("has one main area that the skip link can reach", () => {
    expect(shell).toContain('<main id="main-content"');

    expect(shell.match(/<main/g)?.length).toBe(1);
  });

  it("names its navigation areas for screen readers", () => {
    expect(shell).toContain('aria-label="Help and legal"');

    expect(shell).toContain('aria-label="Main"');
  });
});

describe("document page", () => {
  it("has a table of contents that links to every section", () => {
    expect(documentPage).toContain('aria-label="On this page"');

    expect(documentPage).toContain("href={`#${item.id}`}");

    expect(documentPage).toContain("aria-labelledby={`${section.id}-title`}");

    expect(documentPage).toContain('id="contact"');
  });

  it("shows the date as a machine-readable time", () => {
    expect(documentPage).toContain("<time dateTime={INFO_PAGES_UPDATED_ISO}>");
  });

  it("does not insert raw HTML", () => {
    expect(documentPage).not.toContain("dangerouslySetInnerHTML");

    expect(helpCenter).not.toContain("dangerouslySetInnerHTML");
  });
});

describe("help center", () => {
  it("is a client component with a labelled search box", () => {
    expect(helpCenter.startsWith('"use client";')).toBe(true);

    expect(helpCenter).toContain('htmlFor="help-search"');

    expect(helpCenter).toContain('type="search"');

    expect(helpCenter).toContain('className="sr-only"');
  });

  it("announces the number of results", () => {
    expect(helpCenter).toContain('aria-live="polite"');

    expect(helpCenter).toContain("filterHelpGroups(groups, query)");

    expect(helpCenter).toContain("filterGlossary(glossary, query)");
  });

  it("opens the matching answers while a search is active", () => {
    expect(helpCenter).toContain('open={trimmed === "" ? undefined : true}');
  });

  it("can clear a search that finds nothing", () => {
    expect(helpCenter).toContain("Clear search");

    expect(helpCenter).toContain('setQuery("")');
  });

  it("uses native details elements, so it works with the keyboard", () => {
    expect(helpCenter).toContain("<details");

    expect(helpCenter).toContain("<summary");
  });
});

describe("contact note", () => {
  it("shows a mail link only when an address is set", () => {
    expect(contactNote).toContain("email === null");

    expect(contactNote).toContain("href={`mailto:${email}`}");
  });
});

describe("links from the rest of the product", () => {
  it("shows the three pages in the footer of the home page", () => {
    expect(home).toContain("<PublicFooterLinks />");

    expect(home).toContain('from "@/components/site/public-page-shell"');
  });

  it("asks new people to accept the terms and opens them in a new tab", () => {
    expect(register).toContain('href="/terms"');

    expect(register).toContain('href="/privacy"');

    expect(register.match(/target="_blank"/g)?.length).toBe(2);

    expect(register.match(/rel="noopener noreferrer"/g)?.length).toBe(2);
  });

  it("puts a help button in the app header and the pages in the command palette", () => {
    expect(appLayout).toContain('href="/help"');

    expect(appLayout).toContain('target="_blank"');

    expect(appLayout).toContain('aria-label="Help center (opens in a new tab)"');

    expect(appLayout).toContain("...PUBLIC_INFO_LINKS.map");
  });

  it("lists the pages in the sitemap and allows them in robots.txt", () => {
    expect(sitemap).toContain("PUBLIC_INFO_LINKS.map");

    expect(sitemap).toContain("INFO_PAGES_UPDATED_ISO");

    expect(robots).toContain("PUBLIC_INFO_LINKS.map");
  });

  it("explains in the README how to edit the pages and set a contact address", () => {
    expect(readme).toContain("## Help, privacy and terms");

    expect(readme).toContain("NEXT_PUBLIC_SUPPORT_EMAIL");

    expect(readme).toContain("not legal advice");

    expect(readme).toContain("lib/site/");
  });
});
