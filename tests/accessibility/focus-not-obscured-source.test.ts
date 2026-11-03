import { readdirSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

type Source = { path: string; text: string };

function sourceFiles(): Source[] {
  const found: Source[] = [];

  const walk = (folder: string) => {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const path = `${folder}/${entry.name}`;

      if (entry.isDirectory()) {
        walk(path);
      } else if (path.endsWith(".tsx")) {
        found.push({ path, text: read(path) });
      }
    }
  };

  walk("app");

  walk("components");

  return found.sort((a, b) => a.path.localeCompare(b.path));
}

const FILES = sourceFiles();

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

/** The text of every class string in a file, split in single classes. */
function classLists(text: string): string[][] {
  const lists: string[][] = [];

  for (const match of text.matchAll(/className=\{?["'`]([^"'`]*)["'`]/g)) {
    lists.push(match[1].split(/\s+/).filter((entry) => entry.length > 0));
  }

  return lists;
}

/** The rule for the html element in the base layer of the CSS file. */
function htmlRule(): string {
  return /@layer base \{[\s\S]*?\n {2}html \{([^}]*)\}/.exec(css)?.[1] ?? "";
}

/** The pages that have a bar on top that stays on the screen when the page scrolls. */
const BAR_FILES = [
  "app/(app)/layout.tsx",
  "app/(marketing)/demo/page.tsx",
  "app/(marketing)/page.tsx",
  "components/site/public-page-shell.tsx",
];

type Bar = { path: string; heightRem: number };

function pageBars(): Bar[] {
  const bars: Bar[] = [];

  for (const { path, text } of FILES) {
    for (const match of text.matchAll(/<header\b[^>]*\bsticky\b[^>]*>/g)) {
      const start = match.index ?? 0;

      const after = text.slice(start, start + 400);

      const height = /[\s"]h-(\d+)\b/.exec(after);

      bars.push({ path, heightRem: height ? Number(height[1]) / 4 : 0 });
    }
  }

  return bars;
}

describe("the space under the top bar", () => {
  it("is set once, on the html element, in the base layer of the CSS file", () => {
    expect(css.match(/scroll-padding-top/g)?.length).toBe(1);

    expect(htmlRule()).toContain("scroll-padding-top: 5rem;");
  });

  it("does not use a scroll-padding on any other side, except under the offline notice", () => {
    const outside = css.replace(
      /html:has\(\[data-slot="offline-notice"\] > \[data-state\]\) \{[^}]*\}/,
      "",
    );

    expect(outside).not.toMatch(/scroll-padding-(?:bottom|left|right|inline|block)/);
  });

  it("is higher than every bar that stays on top, with room for its border and some air", () => {
    const offset = Number(/scroll-padding-top: ([\d.]+)rem;/.exec(htmlRule())?.[1]);

    expect(offset).toBeGreaterThan(0);

    const bars = pageBars();

    expect(bars.length).toBeGreaterThan(0);

    for (const bar of bars) {
      expect(bar.heightRem, `${bar.path}: the bar needs an h-N class`).toBeGreaterThan(0);

      expect(offset, bar.path).toBeGreaterThanOrEqual(bar.heightRem + 0.5);
    }
  });

  it("is checked for these pages, so a new bar on top is added to the list on purpose", () => {
    expect([...new Set(pageBars().map((bar) => bar.path))]).toEqual(BAR_FILES);
  });

  it("stays on top of the page: the bar has top-0", () => {
    for (const { path, text } of FILES) {
      for (const match of text.matchAll(/<header\b[^>]*\bsticky\b[^>]*>/g)) {
        expect(match[0], path).toMatch(/\bsticky top-0\b/);
      }
    }
  });
});

describe("cards that a link jumps to", () => {
  it("have no scroll-mt class, because it would be added to the space under the bar", () => {
    const used = FILES.filter(({ text }) => /\bscroll-m[a-z]?-/.test(text)).map(({ path }) => path);

    expect(used).toEqual([]);
  });

  it("are still found by their id", () => {
    const security = read("app/(app)/account/security/page.tsx");

    for (const id of ["email", "password", "recovery-key"]) {
      expect(security, id).toContain(`<Card id="${id}"`);
    }

    expect(read("app/(app)/dashboard/page.tsx")).toContain('<section id="models">');

    expect(read("components/workspaces/model-sharing-card.tsx")).toContain('<Card id="sharing"');

    expect(read("components/variance-review/variance-review-workspace.tsx")).toContain(
      'id="variance-commentary-editor"',
    );

    expect(read("components/decision-center/decision-center-workspace.tsx")).toContain(
      'id="decision-action-form"',
    );
  });
});

describe("page wrappers", () => {
  it("do not turn into a box that scrolls, because a bar inside would not stay on top", () => {
    const wrong: string[] = [];

    for (const { path, text } of FILES) {
      for (const classes of classLists(text)) {
        const isPage = classes.includes("min-h-svh");

        const scrolls = classes.some((entry) =>
          /^overflow-(?:x-|y-)?(?:hidden|auto|scroll)$/.test(entry),
        );

        if (isPage && scrolls) {
          wrong.push(path);
        }
      }
    }

    expect(wrong).toEqual([]);
  });

  it("keep the live demo page from showing a sideways scroll, with a clip and not a box", () => {
    const demo = read("app/(marketing)/demo/page.tsx");

    expect(demo).toContain(
      '<div className="min-h-svh w-full max-w-full overflow-x-clip bg-muted/20">',
    );

    expect(demo).not.toContain("overflow-x-hidden");
  });
});

/** The one box that may sit at the bottom of the screen. It keeps its own space (see below). */
const BOTTOM_NOTICE = "components/app/offline-notice.tsx";

describe("bars at the bottom", () => {
  it("do not exist, except the offline notice, because they would hide the focus there", () => {
    const found: string[] = [];

    for (const { path, text } of FILES) {
      for (const classes of classLists(text)) {
        const fixed = classes.some((entry) => /(?:^|:)(?:fixed|sticky)$/.test(entry));

        const bottom = classes.some((entry) => /(?:^|:)-?bottom-/.test(entry));

        if (fixed && bottom) {
          found.push(path);
        }
      }
    }

    expect(found).toEqual([BOTTOM_NOTICE]);
  });

  it("keep space for the offline notice: the focus stops above it", () => {
    const rule = /html:has\(\[data-slot="offline-notice"\] > \[data-state\]\) \{([^}]*)\}/.exec(
      css,
    );

    expect(rule).not.toBeNull();

    expect(rule?.[1]).toContain("scroll-padding-bottom: 8rem;");

    expect(rule?.[1]).not.toMatch(/scroll-padding-(?:top|left|right|inline|block)/);
  });

  it("keep the same space at the end of the page, so the last field can be scrolled up", () => {
    const rule =
      /html:has\(\[data-slot="offline-notice"\] > \[data-state\]\) body \{([^}]*)\}/.exec(css);

    expect(rule).not.toBeNull();

    expect(rule?.[1]).toContain("padding-bottom: 8rem;");
  });
});

describe("the README", () => {
  it("explains the rule, the two mistakes to avoid and the test", () => {
    const section = readmeSection("Keyboard focus is never hidden under the top bar");

    for (const piece of [
      "WCAG 2.4.11",
      "`app/globals.css`",
      "`scroll-padding-top: 5rem`",
      "`4rem`",
      "`scrollIntoView`",
      "`scroll-mt-*`",
      "`min-h-svh`",
      "`overflow-x-clip`",
      "`scroll-padding-bottom: 8rem`",
      "`tests/accessibility/focus-not-obscured-source.test.ts`",
      "the migration count stays at 17",
    ]) {
      expect(section, piece).toContain(piece);
    }
  });
});
