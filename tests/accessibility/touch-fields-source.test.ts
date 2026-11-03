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

const touchBlocks = topLevelBlocks(css).filter(
  (block) => block.prelude === "@media (pointer: coarse)",
);

const fontRule = touchBlocks.find((block) => block.body.includes("font-size"))?.body ?? "";

const heightRule =
  touchBlocks.find((block) => squash(block.body).endsWith("select,textarea{min-height:2.75rem;}"))
    ?.body ?? "";

/** The selector of a rule, without its declarations. */
const selectorOf = (rule: string) => squash(rule.slice(0, rule.lastIndexOf("{")));

describe("the rule for the height of fields on a touch screen", () => {
  it("is a block for a touch screen, outside every @layer", () => {
    expect(heightRule).not.toBe("");

    for (const block of topLevelBlocks(css)) {
      if (block.prelude.startsWith("@layer")) {
        expect(block.body, block.prelude).not.toContain("select,textarea");
      }
    }
  });

  it("makes typed boxes, selects and text areas at least 44px high", () => {
    expect(squash(heightRule)).toMatch(/^input:not\(/);

    expect(squash(heightRule)).toMatch(/select,textarea\{min-height:2\.75rem;\}$/);
  });

  it("leaves check boxes, radio buttons, sliders, files, hidden fields and buttons alone", () => {
    for (const type of NOT_TYPED) {
      expect(squash(heightRule), type).toContain(`[type="${type}"]`);
    }
  });

  it("uses the same list of boxes as the rule for the size of the text", () => {
    expect(heightRule).not.toBe("");

    expect(fontRule).not.toBe("");

    expect(selectorOf(heightRule)).toBe(selectorOf(fontRule));
  });

  it("is not important, so one place can still choose another size on purpose", () => {
    expect(heightRule).not.toContain("important");
  });

  it("does not change a screen with a mouse", () => {
    const outside = topLevelBlocks(css).filter(
      (block) => block.prelude !== "@media (pointer: coarse)",
    );

    for (const block of outside) {
      expect(squash(block.body), block.prelude).not.toContain("select,textarea{min-height");
    }
  });

  it("is the only rule that gives a field a height on a touch screen", () => {
    const found = touchBlocks.filter((block) => squash(block.body).includes("select,textarea{"));

    expect(found).toHaveLength(2);
  });
});

describe("the places that keep their layout on a touch screen", () => {
  it("has a scenario switcher box without padding above and below", () => {
    const text = read("components/scenarios/scenario-switcher.tsx");

    expect(text).toContain(
      'className="flex items-center gap-2 rounded-lg border bg-background px-2 py-1.5 [@media(pointer:coarse)]:py-0"',
    );
  });

  it("has a Forgot password link with a negative margin, so the rows do not move apart", () => {
    const text = read("components/auth/login-form.tsx");

    expect(text).toContain("touch-target inline-flex items-center");

    expect(text).toContain("[@media(pointer:coarse)]:-my-3");
  });
});

describe("the README", () => {
  it("explains the rule, the list of boxes, the mouse, the switcher and the sign-in link", () => {
    const section = readmeSection("Fields are easy to tap on a phone");

    for (const piece of [
      "44px",
      "`(pointer: coarse)`",
      "`min-height: 2.75rem`",
      "`@layer`",
      "update 35",
      "A test checks that the two lists are the same",
      "a screen with a mouse is not changed",
      "`[@media(pointer:coarse)]:py-0`",
      "`[@media(pointer:coarse)]:-my-3`",
      "`tests/accessibility/touch-fields-source.test.ts`",
      "the migration count stays at 17",
    ]) {
      expect(squash(section).toLowerCase(), piece).toContain(squash(piece).toLowerCase());
    }
  });

  it("comes after the section about buttons", () => {
    const first = readme.indexOf("## Buttons are easy to tap on a phone");

    const second = readme.indexOf("## Fields are easy to tap on a phone");

    const third = readme.indexOf("## Download your data");

    expect(first).toBeGreaterThan(-1);

    expect(second).toBeGreaterThan(first);

    expect(third).toBeGreaterThan(second);
  });

  it("does not say any more that the fields keep their height", () => {
    const section = readmeSection("Buttons are easy to tap on a phone");

    expect(section).not.toContain("text fields (40px high)");
  });
});
