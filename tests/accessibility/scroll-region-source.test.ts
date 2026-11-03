import { readdirSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { HELP_GROUPS } from "@/lib/site/help-content";

const read = (path: string) => readFileSync(path, "utf8");

const readme = read("README.md");

function readmeSection(title: string): string {
  const start = readme.indexOf(`## ${title}\n`);

  if (start === -1) {
    return "";
  }

  const next = readme.indexOf("\n## ", start + 1);

  return readme.slice(start, next === -1 ? readme.length : next);
}

/** The text without spaces and line breaks, with no comma before a closing bracket. */
const squash = (text: string) => text.replace(/\s+/g, "").replace(/,([)}\]])/g, "$1");

/** True when every piece is found and each one comes after the one before it. */
function inOrder(text: string, pieces: string[]): boolean {
  const body = squash(text);

  let from = 0;

  for (const piece of pieces) {
    const at = body.indexOf(squash(piece), from);

    if (at === -1) {
      return false;
    }

    from = at + 1;
  }

  return true;
}

function pageFiles(): string[] {
  const files: string[] = [];

  const walk = (folder: string) => {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const path = `${folder}/${entry.name}`;

      if (entry.isDirectory()) {
        walk(path);
      } else if (path.endsWith(".tsx")) {
        files.push(path);
      }
    }
  };

  walk("components");

  walk("app");

  return files.sort();
}

const FILES = pageFiles().map((path) => ({ path, text: read(path) }));

const COMPONENT = "components/ui/scroll-region.tsx";

/** The table of a chart is for a screen reader only. It is hidden, so it has nothing to scroll. */
const HIDDEN_TABLES = ["components/charts/accessible-chart.tsx"];

/**
 * Boxes that scroll without a ScrollRegion, and why.
 * The tab bar of the demo page is made of buttons, and they take the focus. The example header of
 * the Actuals file is a text that wraps at its spaces, so it does not scroll.
 */
const OTHER_SCROLL_BOXES: Record<string, number> = {
  [COMPONENT]: 1,
  "components/demo/demo-scenario-tabs.tsx": 1,
  "components/actuals/actuals-variance-workspace.tsx": 1,
};

const importLine = 'import { ScrollRegion } from "@/components/ui/scroll-region";';

type Region = { path: string; tag: string; label: string; inner: string };

function regionsOf(path: string, text: string): Region[] {
  const found: Region[] = [];

  const pattern = /<ScrollRegion\b([^>]*)>([\s\S]*?)<\/ScrollRegion>/g;

  for (const match of text.matchAll(pattern)) {
    const label = /label=(?:"([^"]*)"|\{([A-Za-z]+)\})/.exec(match[1]);

    found.push({
      path,
      tag: match[1],
      label: label ? (label[1] ?? `{${label[2]}}`) : "",
      inner: match[2],
    });
  }

  return found;
}

const REGIONS = FILES.flatMap(({ path, text }) => regionsOf(path, text));

describe("the component", () => {
  const source = read(COMPONENT);

  it("can get the focus, has a role and a name, and the caller cannot change them", () => {
    expect(
      inOrder(source, [
        "{...props}",
        'data-slot="scroll-region"',
        'role="region"',
        "aria-label={label}",
        "tabIndex={0}",
      ]),
    ).toBe(true);

    expect(source).toContain('"aria-label" | "aria-labelledby" | "role" | "tabIndex"');

    expect(source).toContain("label: string;");
  });

  it("scrolls sideways, keeps a swipe inside and leaves the focus line to the second box", () => {
    expect(source).toContain(
      'cn("peer overflow-x-auto overscroll-x-contain outline-none", className)',
    );
  });

  it("draws the focus line in a second box after the first one, on top of the fixed cells", () => {
    expect(
      inOrder(source, [
        '<div data-slot="scroll-region-frame" className="relative isolate">',
        'data-slot="scroll-region"',
        "/>",
        'aria-hidden="true"',
        'data-slot="scroll-region-focus"',
        "pointer-events-none absolute inset-0 z-30 opacity-0",
        "outline-2 -outline-offset-2 outline-ring peer-focus-visible:opacity-100",
      ]),
    ).toBe(true);
  });
});

describe("the tables of the app", () => {
  it("are all inside a ScrollRegion, one table in each", () => {
    const withTables = FILES.filter(({ text }) => text.includes("<table"));

    expect(withTables.length).toBeGreaterThan(20);

    for (const { path, text } of withTables) {
      const tables = text.match(/<table\b/g)?.length ?? 0;

      const regions = text.match(/<ScrollRegion\b/g)?.length ?? 0;

      if (HIDDEN_TABLES.includes(path)) {
        expect(regions, path).toBe(0);
      } else {
        expect(regions, path).toBe(tables);
      }
    }
  });

  it("are hidden for the eye when they have no ScrollRegion, so there is nothing to scroll", () => {
    for (const path of HIDDEN_TABLES) {
      expect(inOrder(read(path), ['<div className="sr-only">', "<table>"]), path).toBe(true);
    }
  });

  it("have a ScrollRegion that holds the table and nothing else", () => {
    for (const region of REGIONS) {
      const inner = region.inner.trim();

      expect(inner.startsWith("<table"), `${region.path}: ${region.label}`).toBe(true);

      expect(inner.endsWith("</table>"), `${region.path}: ${region.label}`).toBe(true);

      expect(inner.match(/<table\b/g)?.length, `${region.path}: ${region.label}`).toBe(1);
    }
  });

  it("have 41 boxes in 26 files, so a lost box is noticed", () => {
    expect(REGIONS).toHaveLength(41);

    expect(new Set(REGIONS.map((region) => region.path)).size).toBe(26);
  });

  it("import the component in every file that uses it, and only there", () => {
    for (const { path, text } of FILES) {
      if (path === COMPONENT) {
        continue;
      }

      expect(text.includes("<ScrollRegion"), path).toBe(text.includes(importLine));
    }
  });

  it("have a name in words, and no two boxes of a file have the same name", () => {
    const names: Record<string, string[]> = {};

    for (const region of REGIONS) {
      expect(region.label.trim().length, region.path).toBeGreaterThan(2);

      names[region.path] = [...(names[region.path] ?? []), region.label];
    }

    for (const [path, labels] of Object.entries(names)) {
      expect(new Set(labels).size, path).toBe(labels.length);
    }
  });

  it("take the name of the table component from its caption", () => {
    const labelled = REGIONS.filter((region) => region.label.startsWith("{"));

    expect(labelled.map((region) => [region.path, region.label])).toEqual([
      ["components/financial/financial-table.tsx", "{caption}"],
    ]);

    expect(read("components/financial/financial-table.tsx")).toContain(
      '<caption className="sr-only">',
    );
  });

  it("keep the sticky header of the four tall tables, with a height and a scroll up and down", () => {
    const tall = REGIONS.filter((region) => region.tag.includes("overflow-y-auto"));

    expect(tall.map((region) => region.label).sort()).toEqual([
      "Downside cash path",
      "Liquidity path after funding",
      "Rolling actuals + forecast",
      "Validation issues",
    ]);

    for (const region of tall) {
      expect(region.tag, region.label).toMatch(/className="max-h-[^"]+ overflow-y-auto"/);

      expect(region.tag, region.label).not.toContain("overflow-x-auto");
    }
  });
});

describe("other boxes that scroll", () => {
  it("are only the ones that are listed here, with a reason", () => {
    for (const { path, text } of FILES) {
      const count = text.match(/\boverflow-(?:x-)?auto\b/g)?.length ?? 0;

      expect(count, path).toBe(OTHER_SCROLL_BOXES[path] ?? 0);
    }
  });
});

describe("the focus line", () => {
  const css = read("app/globals.css");

  it("uses a color that exists, and a ring color that is checked for contrast", () => {
    expect(css).toContain("--color-ring: var(--ring);");

    expect(read("tests/accessibility/contrast-tokens.test.ts")).toContain(
      "keeps the focus ring at 3 to 1 or more on the page and on a card",
    );
  });

  it("is not set in the CSS file, so there is one place for it", () => {
    expect(css).not.toContain("scroll-region");
  });

  it("does not change the rule for Windows high contrast mode", () => {
    expect(inOrder(css, ["@media (forced-colors: active) {", ":focus-visible {"])).toBe(true);

    expect(css).toContain("outline: 2px solid Highlight");
  });
});

describe("the help page and the README", () => {
  it("answers the question about wide tables", () => {
    const group = HELP_GROUPS.find((entry) => entry.id === "getting-started");

    const item = group?.items.find((entry) => entry.id === "wide-tables");

    expect(item?.question).toBe("How do I see the rest of a wide table with the keyboard?");

    expect(item?.answer).toHaveLength(2);

    expect(item?.answer[0]).toContain(
      "Press Tab until a line appears inside the edge of the table",
    );

    expect(item?.answer[0]).toContain("Left and Right arrow keys");

    expect(item?.answer[1]).toContain("Monthly variance");
  });

  it("puts the new question after the one about unsaved changes", () => {
    const group = HELP_GROUPS.find((entry) => entry.id === "getting-started");

    const ids = (group?.items ?? []).map((entry) => entry.id);

    expect(ids.indexOf("unsaved-changes")).toBeGreaterThan(-1);

    expect(ids.indexOf("wide-tables")).toBe(ids.indexOf("unsaved-changes") + 1);
  });

  it("has a README section that names the component, the focus line, the test and the exceptions", () => {
    const section = readmeSection("Wide tables you can scroll with the keyboard");

    for (const piece of [
      "`ScrollRegion`",
      "`components/ui/scroll-region.tsx`",
      "`overflow-x-auto`",
      "`tabIndex={0}`",
      '`role="region"`',
      "`label`",
      "`overscroll-x-contain`",
      "`FinancialTable`",
      "`--ring`",
      "`peer-focus-visible`",
      "`z-30`",
      "overflow-y-auto",
      "`className`",
      "`tests/accessibility/scroll-region-source.test.ts`",
      "**Not changed:** the hidden table of each chart",
      "`AccessibleChart`",
      "the migration count stays at 17",
    ]) {
      expect(section, piece).toContain(piece);
    }
  });
});
