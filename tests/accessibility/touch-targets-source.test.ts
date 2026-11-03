import { readdirSync, readFileSync } from "node:fs";

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

/** The text without spaces and line breaks. */
const squash = (text: string) => text.replace(/\s+/g, "");

type Block = { prelude: string; body: string };

/** The blocks of the CSS file that are not inside another block, so not inside an @layer. */
function topLevelBlocks(text: string): Block[] {
  const source = text.replace(/\/\*[\s\S]*?\*\//g, "");

  const blocks: Block[] = [];

  let depth = 0;

  let start = 0;

  let bodyStart = 0;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];

    if (char === "{") {
      if (depth === 0) {
        bodyStart = index + 1;
      }

      depth += 1;
    } else if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        blocks.push({
          prelude: source
            .slice(start, bodyStart - 1)
            .trim()
            .replace(/\s+/g, " "),
          body: source.slice(bodyStart, index),
        });

        start = index + 1;
      }
    } else if (char === ";" && depth === 0) {
      start = index + 1;
    }
  }

  return blocks;
}

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

const touchBlocks = topLevelBlocks(css).filter(
  (block) => block.prelude === "@media (pointer: coarse)",
);

const rule = touchBlocks.find((block) => block.body.includes("2.75rem"))?.body ?? "";

describe("the rule for buttons on a touch screen", () => {
  it("is in a block for a touch screen, outside every @layer", () => {
    expect(rule).not.toBe("");

    for (const block of topLevelBlocks(css)) {
      if (block.prelude.startsWith("@layer")) {
        expect(block.body, block.prelude).not.toContain("2.75rem");
      }
    }
  });

  it("makes every Button, menu item and touch-target at least 44px high", () => {
    expect(squash(rule)).toContain(
      squash(`[data-touch="grow"]:not([data-variant="link"]),
      [data-slot="dropdown-menu-item"],
      [data-slot="dropdown-menu-checkbox-item"],
      [data-slot="dropdown-menu-radio-item"],
      .touch-target {
        min-height: 2.75rem;
      }`),
    );
  });

  it("makes every Button and touch-target at least 44px wide", () => {
    expect(squash(rule)).toContain(
      squash(`[data-touch="grow"]:not([data-variant="link"]),
      .touch-target {
        min-width: 2.75rem;
      }`),
    );
  });

  it("makes the row of a check box or a radio button at least 44px high", () => {
    expect(squash(rule)).toContain(
      squash(`label:has(> input[type="checkbox"], > input[type="radio"]) {
        min-height: 2.75rem;
      }`),
    );
  });

  it("does not use data-slot for a button, because a Radix trigger replaces it", () => {
    expect(css).not.toContain('[data-slot="button"]');
  });

  it("is not important, so one place can still choose another size on purpose", () => {
    expect(rule).not.toContain("important");
  });

  it("does not change a screen with a mouse", () => {
    const outside = topLevelBlocks(css).filter(
      (block) => block.prelude !== "@media (pointer: coarse)",
    );

    for (const block of outside) {
      expect(block.body, block.prelude).not.toContain("2.75rem");
    }
  });
});

describe("Button", () => {
  const button = functionSource(read("components/ui/button.tsx"), "Button");

  it("marks itself with data-touch before the props, so one button can opt out", () => {
    const mark = button.indexOf('data-touch="grow"');

    expect(mark).toBeGreaterThan(-1);

    expect(button.indexOf("{...props}")).toBeGreaterThan(mark);
  });

  it("is the only place that marks a button with data-touch grow", () => {
    const files = sourceFiles(["app", "components"], [".tsx"]).filter(
      (file) => file !== "components/ui/button.tsx",
    );

    const found = files.filter((file) => read(file).includes('data-touch="grow"'));

    expect(found).toEqual([]);
  });
});

describe("a button inside a field", () => {
  const files = sourceFiles(["app", "components"], [".tsx"]);

  it("is only the eye button of a password field", () => {
    const found = files.filter((file) => read(file).includes('data-touch="inside"'));

    expect(found).toEqual(["components/auth/password-input.tsx"]);
  });

  it("has a touch area of 44px made with a bigger ::after box", () => {
    const text = read("components/auth/password-input.tsx");

    expect(text).toContain('size="icon-sm"');

    expect(text).toContain("absolute");

    expect(text).toContain("after:absolute after:-inset-2");

    expect(text).toContain("after:content-['']");
  });
});

describe("the touch-target class", () => {
  const files = sourceFiles(["app", "components"], [".tsx"]);

  it("is used for the links that are a tap target on their own", () => {
    const expected: Record<string, number> = {
      "components/auth/login-form.tsx": 1,
      "components/demo/demo-scenario-tabs.tsx": 1,
      "components/projects/project-mobile-workspace-nav.tsx": 1,
      "components/site/document-page.tsx": 1,
      "components/site/help-center.tsx": 3,
      "components/site/public-page-shell.tsx": 1,
    };

    for (const [file, count] of Object.entries(expected)) {
      expect(read(file).match(/\btouch-target\b/g)?.length ?? 0, file).toBe(count);
    }
  });

  it("is always used with flex on a link, so the text stays in the middle", () => {
    const bad: string[] = [];

    for (const file of files) {
      const text = read(file);

      for (const match of text.matchAll(/"([^"]*\btouch-target\b[^"]*)"/g)) {
        // A button puts its own text in the middle, so only a link needs flex.
        const tag = text.slice(text.lastIndexOf("<", match.index), match.index);

        if (/^<button\b/.test(tag)) {
          continue;
        }

        if (/(^| )(inline-)?flex( |$)/.test(match[1]) === false) {
          bad.push(`${file}: ${match[1]}`);
        }
      }
    }

    expect(bad).toEqual([]);
  });

  it("is not used in components/ui, where every button already has the rule", () => {
    const found = sourceFiles(["components/ui"], [".tsx"]).filter((file) =>
      read(file).includes("touch-target"),
    );

    expect(found).toEqual([]);
  });
});

describe("the title of a window", () => {
  it("keeps room for the close button, so a long title does not run under it", () => {
    const title = functionSource(read("components/ui/dialog.tsx"), "DialogTitle");

    expect(title).toContain("pr-10");
  });

  it("has a close button that is a Button, so it is 44px on a phone", () => {
    const text = read("components/ui/dialog.tsx");

    expect(squash(text)).toContain(
      squash('<DialogPrimitive.Close data-slot="dialog-close" asChild>'),
    );

    expect(squash(text)).toContain(
      squash('<Button variant="ghost" className="absolute top-2 right-2"'),
    );
  });
});

describe("the header of the app", () => {
  it("has a gap of 8px, so the six controls of 44px fit in 320px", () => {
    const layout = read("app/(app)/layout.tsx");

    expect(layout).toContain("items-center justify-between gap-2 border-b");

    expect(layout).not.toContain("justify-between gap-3 border-b");
  });
});

describe("the README", () => {
  it("explains the rule, the attributes, the class, the field button and the title", () => {
    const section = readmeSection("Buttons are easy to tap on a phone");

    for (const piece of [
      "WCAG 2.5.5",
      "44px",
      "`(pointer: coarse)`",
      "`@layer`",
      "`min-height`",
      "`min-width`",
      '`data-touch="grow"`',
      "`data-slot`",
      "replaces `data-slot` with its own name",
      "ask for about 44px",
      "`asChild`",
      '`variant="link"`',
      "`.touch-target`",
      "`inline-flex items-center`",
      '`data-touch="inside"`',
      "`after:-inset-2`",
      "`pr-10`",
      "`gap-2`",
      "`tests/accessibility/touch-targets-source.test.ts`",
      "the migration count stays at 17",
    ]) {
      expect(squash(section), piece).toContain(squash(piece));
    }
  });

  it("comes after the section about pop-up windows", () => {
    const first = readme.indexOf("## Pop-up windows fit short screens and the keyboard");

    const second = readme.indexOf("## Buttons are easy to tap on a phone");

    const third = readme.indexOf("## Download your data");

    expect(first).toBeGreaterThan(-1);

    expect(second).toBeGreaterThan(first);

    expect(third).toBeGreaterThan(second);
  });
});
