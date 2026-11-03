import { readdirSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

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

/** The text without spaces and line breaks. */
const squash = (text: string) => text.replace(/\s+/g, "");

/** The source of one function of a file, up to the next function. */
function functionSource(text: string, name: string): string {
  const start = text.indexOf(`function ${name}(`);

  if (start === -1) {
    return "";
  }

  const next = text.indexOf("\nfunction ", start + 1);

  return text.slice(start, next === -1 ? text.length : next);
}

function sourceFiles(folders: string[], endings: string[]): string[] {
  const files: string[] = [];

  const walk = (folder: string) => {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const path = `${folder}/${entry.name}`;

      if (entry.isDirectory()) {
        walk(path);
      } else if (endings.some((ending) => path.endsWith(ending))) {
        files.push(path);
      }
    }
  };

  for (const folder of folders) {
    walk(folder);
  }

  return files.sort();
}

const dialog = read("components/ui/dialog.tsx");

const alertDialog = read("components/ui/alert-dialog.tsx");

const palette = read("components/app/command-palette.tsx");

const dialogContent = functionSource(dialog, "DialogContent");

const alertContent = functionSource(alertDialog, "AlertDialogContent");

describe("DialogContent", () => {
  it("is never higher than the screen, and scrolls inside when its content is higher", () => {
    expect(dialogContent).toContain("max-h-[calc(100svh-2rem)]");

    expect(dialogContent).toContain("overflow-y-auto");
  });

  it("keeps the margin of 1rem on each side of a phone", () => {
    expect(dialogContent).toContain("w-full max-w-[calc(100%-2rem)]");
  });

  it("has a placement, in the middle by default", () => {
    expect(dialogContent).toContain('placement = "center"');

    expect(dialogContent).toContain('placement?: "center" | "top"');
  });

  it("puts a window with placement top near the top on a phone, and in the middle from 1024px", () => {
    expect(squash(dialogContent)).toContain(
      squash(`placement === "top"
            ? "top-[6%] lg:top-1/2 lg:-translate-y-1/2"
            : "top-1/2 -translate-y-1/2"`),
    );
  });

  it("does not put the position in the base classes, so two classes never fight for it", () => {
    const base = /"(fixed left-1\/2[^"]*)"/.exec(dialogContent)?.[1] ?? "";

    expect(base).not.toBe("");

    expect(base).not.toMatch(/(^| )top-/);

    expect(base).not.toMatch(/translate-y/);
  });
});

describe("AlertDialogContent", () => {
  it("is never higher than the screen, and scrolls inside when its content is higher", () => {
    expect(alertContent).toContain("max-h-[calc(100svh-2rem)]");

    expect(alertContent).toContain("overflow-y-auto");
  });

  it("leaves 1rem on each side of a phone, also on a screen that is 320px wide", () => {
    expect(alertContent).toContain("data-[size=default]:max-w-[min(20rem,calc(100%-2rem))]");

    expect(alertContent).toContain("data-[size=sm]:max-w-[min(20rem,calc(100%-2rem))]");

    expect(alertContent).not.toMatch(/max-w-xs/);
  });

  it("is wider from 640px, like before", () => {
    expect(alertContent).toContain("data-[size=default]:sm:max-w-sm");
  });
});

describe("the search window", () => {
  it("is near the top on a phone, so the keyboard does not cover the list", () => {
    expect(squash(palette)).toContain(
      squash(`<DialogContent
          showCloseButton={false}
          placement="top"
          className="gap-0 overflow-hidden p-0 sm:max-w-xl"
        >`),
    );
  });

  it("has a list that is at most 30% of the screen high on a phone, and 20rem from 640px", () => {
    expect(palette).toContain(
      'className="max-h-[min(20rem,30svh)] overflow-y-auto p-2 sm:max-h-[min(20rem,calc(100svh-10rem))]"',
    );
  });

  it("hides the line about the arrow keys and Esc under 640px, because a phone has no such keys", () => {
    expect(palette).toContain(
      'className="hidden items-center justify-between gap-3 border-t bg-muted/40 px-4 py-2 text-[11px] text-muted-foreground sm:flex"',
    );
  });
});

describe("the windows of the app", () => {
  const files = sourceFiles(["app", "components"], [".tsx"]).filter(
    (file) => file.startsWith("components/ui/") === false,
  );

  it("only the search window may hide the overflow of a window", () => {
    const found: string[] = [];

    for (const file of files) {
      const text = read(file);

      for (const match of text.matchAll(/<(?:Alert)?DialogContent\b[^>]*?className="([^"]*)"/g)) {
        if (/\boverflow-hidden\b/.test(match[1])) {
          found.push(file);
        }
      }
    }

    expect(found).toEqual(["components/app/command-palette.tsx"]);
  });

  it("use svh and never vh, h-screen or min-h-screen for a height", () => {
    const bad: string[] = [];

    for (const file of sourceFiles(["app", "components"], [".tsx", ".css"])) {
      if (/\b(?:h|min-h|max-h)-screen\b|\[\d+vh\]|\b100vh\b/.test(read(file))) {
        bad.push(file);
      }
    }

    expect(bad).toEqual([]);
  });
});

describe("the README", () => {
  it("explains the scroll, the margin, the search window, the placement and the test", () => {
    const section = readmeSection("Pop-up windows fit short screens and the keyboard");

    for (const piece of [
      "WCAG 1.4.10",
      "At 400% zoom a screen is only 320 by 256 pixels",
      "`DialogContent`",
      "`AlertDialogContent`",
      "`max-h-[calc(100svh-2rem)]`",
      "`overflow-y-auto`",
      "`svh`",
      "`min(20rem, 100% - 2rem)`",
      "`placement`",
      '`placement="top"`',
      '`placement="center"`',
      "`30svh`",
      "`tests/accessibility/popups-source.test.ts`",
      "the migration count stays at 17",
    ]) {
      expect(squash(section), piece).toContain(squash(piece));
    }
  });

  it("comes after the section about fields on a phone", () => {
    const first = readme.indexOf("## Fields do not zoom the page on a phone");

    const second = readme.indexOf("## Pop-up windows fit short screens and the keyboard");

    const third = readme.indexOf("## Download your data");

    expect(first).toBeGreaterThan(-1);

    expect(second).toBeGreaterThan(first);

    expect(third).toBeGreaterThan(second);
  });
});
