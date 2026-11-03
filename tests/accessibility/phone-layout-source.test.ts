import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

const css = read("app/globals.css");

const readme = read("README.md");

function readmeSection(title: string): string {
  const start = readme.indexOf(`## ${title}\n`);

  if (start === -1) {
    return "";
  }

  const next = readme.indexOf("\n## ", start + 1);

  return readme.slice(start, next === -1 ? readme.length : next);
}

/** The pages with a bar on top that has buttons next to the logo. The app bar has its own small logo. */
const PUBLIC_BARS = [
  "app/(marketing)/demo/page.tsx",
  "app/(marketing)/page.tsx",
  "components/site/public-page-shell.tsx",
];

describe("grids without column classes", () => {
  it("get one column that can shrink, in the base layer, so a wide table cannot widen the page", () => {
    expect(css).toMatch(
      /@layer base \{[\s\S]*?\n {2}:where\(\.grid\) \{\n {4}grid-template-columns: minmax\(0, 1fr\);\n {2}\}/,
    );
  });

  it("does not use important, so a grid-cols class on a grid is stronger and still wins", () => {
    const rule = /:where\(\.grid\) \{([^}]*)\}/.exec(css)?.[1] ?? "";

    expect(rule).toContain("grid-template-columns");

    expect(rule).not.toContain("important");
  });

  it("is written once", () => {
    expect(css.match(/:where\(\.grid\)/g)?.length).toBe(1);
  });
});

describe("the badge", () => {
  const badge = read("components/ui/badge.tsx");

  it("grows with its text instead of cutting it off, and is as high as before for one line", () => {
    expect(badge).toContain("inline-flex min-h-5 w-fit max-w-full shrink-0");

    expect(badge).toContain("px-2 py-0 text-xs");

    expect(badge).not.toMatch(/[\s"]h-5[\s"]/);
  });

  it("keeps a short label on one line", () => {
    expect(badge).toContain("whitespace-nowrap");
  });

  it("lets the long label on the home page wrap on a very narrow phone", () => {
    const home = read("app/(marketing)/page.tsx");

    expect(home).toMatch(
      /<span className="whitespace-normal text-center">\s*FINANCIAL PLANNING & SCENARIO SIMULATION\s*<\/span>\s*<\/Badge>/,
    );
  });
});

describe("the logo", () => {
  const logo = read("components/brand/venturescope-logo.tsx");

  it("can hide its name on a screen narrower than 360px, and only then", () => {
    expect(logo).toContain("shortOnPhone?: boolean;");

    expect(logo).toContain("shortOnPhone = false,");

    expect(logo).toContain(
      'className={cn("flex flex-col leading-none", shortOnPhone && "max-[360px]:hidden")}',
    );

    expect(logo.match(/max-\[360px\]:hidden/g)?.length).toBe(1);
  });

  it("keeps the name of the link for a screen reader when the words are hidden", () => {
    expect(logo).toContain('aria-label="VentureScope home"');
  });

  it("is used with the short form in the bars that have buttons next to it", () => {
    for (const path of PUBLIC_BARS) {
      const text = read(path);

      const bar = /<header\b[^>]*\bsticky\b[^>]*>[\s\S]*?<\/header>/.exec(text)?.[0] ?? "";

      expect(bar, path).toContain("<VentureScopeLogo shortOnPhone />");
    }
  });

  it("shows the small icon only in the bar of the app, which has more buttons", () => {
    expect(read("app/(app)/layout.tsx")).toContain("<VentureScopeLogo compact />");
  });
});

describe("the README", () => {
  it("explains the grid rule, the badge and the logo, and what was left alone", () => {
    const section = readmeSection("Pages that fit a phone screen");

    for (const piece of [
      "WCAG 1.4.10",
      "`app/globals.css`",
      "`:where(.grid)`",
      "`minmax(0, 1fr)`",
      "`grid-cols-*`",
      "a `grid-cols-*` class on a grid is stronger and still wins",
      "`min-w-0`",
      "`Badge`",
      "`min-h-5`",
      "`shortOnPhone`",
      "360px",
      "`tests/accessibility/phone-layout-source.test.ts`",
      "the migration count stays at 17",
    ]) {
      expect(section, piece).toContain(piece);
    }
  });
});
