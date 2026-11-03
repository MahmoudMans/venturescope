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

/** The class names of every select, input and text area in a file. */
function fieldClasses(text: string): string[][] {
  const lists: string[][] = [];

  for (const match of text.matchAll(/<(?:select|input|textarea)\b/g)) {
    let depth = 0;

    let index = (match.index ?? 0) + match[0].length;

    while (index < text.length) {
      const char = text[index];

      if (char === "{") {
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
      } else if (char === ">" && depth === 0 && text[index - 1] !== "=") {
        break;
      }

      index += 1;
    }

    const tag = text.slice(match.index ?? 0, index + 1);

    const className = /className="([^"]*)"/.exec(tag)?.[1];

    if (className !== undefined) {
      lists.push(className.split(/\s+/).filter((entry) => entry.length > 0));
    }
  }

  return lists;
}

/** The types of box that a person does not type in. They keep their size. */
const NOT_TYPED = [
  "checkbox",
  "radio",
  "range",
  "file",
  "hidden",
  "submit",
  "button",
  "reset",
  "image",
  "color",
];

describe("the rule for fields on a touch screen", () => {
  const blocks = topLevelBlocks(css).filter(
    (block) => block.prelude === "@media (pointer: coarse)",
  );

  const rule = blocks.find((block) => block.body.includes("font-size"))?.body ?? "";

  it("is in a block for a touch screen, outside every @layer", () => {
    expect(blocks.length).toBeGreaterThan(0);

    for (const block of topLevelBlocks(css)) {
      if (block.prelude.startsWith("@layer")) {
        expect(block.body, block.prelude).not.toContain("pointer");
      }
    }
  });

  it("makes selects, text areas and typed boxes at least 16px, so an iPhone does not zoom", () => {
    expect(squash(rule)).toMatch(/select,textarea\{font-size:max\(16px,1rem\);\}$/);

    expect(squash(rule)).toMatch(/^input:not\(/);

    expect(css.match(/font-size: max\(16px, 1rem\)/g)).toHaveLength(1);
  });

  it("leaves check boxes, radio buttons, sliders, files, hidden fields and buttons alone", () => {
    for (const type of NOT_TYPED) {
      expect(squash(rule), type).toContain(`[type="${type}"]`);
    }
  });

  it("is not important, so one place can still choose another size on purpose", () => {
    expect(rule).not.toContain("important");
  });

  it("does not change a screen with a mouse", () => {
    const outside = topLevelBlocks(css).filter(
      (block) => block.prelude !== "@media (pointer: coarse)",
    );

    for (const block of outside) {
      expect(block.body, block.prelude).not.toContain("max(16px, 1rem)");
    }
  });
});

describe("zooming by the person", () => {
  it("is never blocked, because the zoom of the iPhone is not fixed with maximum-scale", () => {
    const files = sourceFiles(["app", "components", "lib"], [".ts", ".tsx"]);

    const bad = files.filter((file) =>
      /maximum-scale|user-scalable|maximumScale|userScalable/i.test(read(file)),
    );

    expect(bad).toEqual([]);
  });

  it("has a viewport setting that only sets the color of the browser bar", () => {
    const layout = read("app/layout.tsx");

    const viewport = /export const viewport: Viewport = \{([\s\S]*?)\n\};/.exec(layout)?.[1] ?? "";

    expect(viewport).toContain("themeColor");

    expect(viewport).not.toMatch(/Scale|scalable/i);
  });
});

describe("selects with a long name", () => {
  const wide: Array<[string, string]> = [
    ["components/board-room/board-room-workspace.tsx", "sm:min-w-72"],
    ["components/planning-cycle/planning-cycle-workspace.tsx", "sm:min-w-64"],
  ];

  it("fit the card on a phone and are wider only from 640px", () => {
    for (const [path, minimum] of wide) {
      expect(read(path), path).toContain(
        `className="h-10 w-full max-w-full rounded-lg border bg-background px-3 text-sm sm:w-auto ${minimum}"`,
      );
    }
  });

  it("are the only fields with a minimum width, except the short period list of the Board pack", () => {
    const found: string[] = [];

    for (const file of sourceFiles(["app", "components"], [".tsx"])) {
      for (const list of fieldClasses(read(file))) {
        for (const name of list) {
          // min-w-0 lets a field shrink, so it is the safe one.
          if (name.startsWith("min-w-") && name !== "min-w-0") {
            found.push(`${file} ${name}`);
          }
        }
      }
    }

    // The Board pack list has only short periods, and 14rem fits a screen that is 320px wide.
    expect(found).toEqual(["components/board-pack/board-pack-workspace.tsx min-w-56"]);
  });
});

describe("the README", () => {
  it("explains the zoom, the rule, why it is outside the layers, the zoom of the person, and the test", () => {
    const section = readmeSection("Fields do not zoom the page on a phone");

    for (const piece of [
      "16px",
      "`@media (pointer: coarse)`",
      "`font-size: max(16px, 1rem)`",
      "outside every `@layer`",
      "`maximum-scale`",
      "`user-scalable`",
      "WCAG 1.4.4",
      "Board room",
      "Planning cycle",
      "`tests/accessibility/phone-fields-source.test.ts`",
      "the migration count stays at 17",
    ]) {
      expect(squash(section), piece).toContain(squash(piece));
    }
  });

  it("comes after the section about names and numbers", () => {
    const first = readme.indexOf("## Names and numbers are never cut off");

    const second = readme.indexOf("## Fields do not zoom the page on a phone");

    const third = readme.indexOf("## Download your data");

    expect(first).toBeGreaterThan(-1);

    expect(second).toBeGreaterThan(first);

    expect(third).toBeGreaterThan(second);
  });
});
