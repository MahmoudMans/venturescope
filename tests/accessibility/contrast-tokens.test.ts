import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

import { HELP_GROUPS } from "@/lib/site/help-content";

const css = readFileSync("app/globals.css", "utf8");

const readme = readFileSync("README.md", "utf8");

/** The exclamation mark is written with its code, so this file is easy to paste in a terminal. */
const BANG = String.fromCharCode(33);

/** The text without spaces and line breaks, so the layout of the file does not matter. */
const squash = (text: string) => text.replace(/\s+/g, "");

function readmeSection(title: string): string {
  const start = readme.indexOf(`## ${title}\n`);

  if (start === -1) {
    return "";
  }

  const next = readme.indexOf("\n## ", start + 1);

  return readme.slice(start, next === -1 ? readme.length : next);
}

/** The text between the braces of the block that starts at the given place. */
function blockAt(source: string, start: number): string {
  if (start === -1) {
    return "";
  }

  const open = source.indexOf("{", start);

  let depth = 0;

  for (let index = open; index < source.length; index += 1) {
    if (source[index] === "{") {
      depth += 1;
    }

    if (source[index] === "}") {
      depth -= 1;

      if (depth === 0) {
        return source.slice(open + 1, index);
      }
    }
  }

  throw new Error("A block in globals.css is not closed.");
}

type Tokens = Record<string, string>;

/** The custom properties (the colors) declared in a block, by name. */
function tokens(block: string): Tokens {
  const found: Tokens = {};

  for (const match of block.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) {
    found[match[1]] = match[2].trim();
  }

  return found;
}

type Rgb = [number, number, number];

const encode = (value: number) =>
  value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;

const decode = (value: number) =>
  value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/** An oklch color as light amounts of red, green and blue (0 to 1), and its see-through amount. */
function parseColor(value: string): { rgb: Rgb; alpha: number } {
  const match = value.match(
    /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+)%)?\s*\)$/,
  );

  if (match === null) {
    throw new Error(`The color is not written as oklch: ${value}`);
  }

  const lightness = Number(match[1]);

  const chroma = Number(match[2]);

  const hue = (Number(match[3]) * Math.PI) / 180;

  const a = chroma * Math.cos(hue);

  const b = chroma * Math.sin(hue);

  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;

  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;

  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return {
    rgb: [
      clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
      clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
      clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    ],
    alpha: match[4] === undefined ? 1 : Number(match[4]) / 100,
  };
}

/** The color as it looks on a surface. A browser mixes a see-through color in the encoded values. */
function resolve(value: string, under?: Rgb): Rgb {
  const { rgb, alpha } = parseColor(value);

  if (alpha === 1 || under === undefined) {
    return rgb;
  }

  return rgb.map((channel, index) =>
    decode(encode(channel) * alpha + encode(under[index]) * (1 - alpha)),
  ) as Rgb;
}

function luminance([red, green, blue]: Rgb): number {
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function ratioOf(first: Rgb, second: Rgb): number {
  const one = luminance(first);

  const two = luminance(second);

  return (Math.max(one, two) + 0.05) / (Math.min(one, two) + 0.05);
}

/** The contrast of a color on a surface of the same theme. */
function contrast(theme: Tokens, front: string, back: string): number {
  const behind = resolve(theme[back]);

  return ratioOf(resolve(theme[front], behind), behind);
}

const rootStart = css.indexOf("\n:root {");

const darkStart = css.indexOf("\n.dark {");

const baseStart = css.indexOf("@layer base");

const moreStart = css.indexOf("@media (prefers-contrast: more)");

const forcedStart = css.indexOf("@media (forced-colors: active)");

const printStart = css.indexOf("@media print");

const light = tokens(blockAt(css, rootStart));

const dark = { ...light, ...tokens(blockAt(css, darkStart)) };

const moreBlock = blockAt(css, moreStart);

const moreLightOnly = tokens(blockAt(moreBlock, moreBlock.indexOf(":root {")));

const moreDarkOnly = tokens(blockAt(moreBlock, moreBlock.indexOf(".dark {")));

const forcedBlock = blockAt(css, forcedStart);

const NORMAL_LOOKS = [
  { name: "light", theme: light },
  { name: "dark", theme: dark },
];

const MORE_LOOKS = [
  { name: "light with more contrast", theme: { ...light, ...moreLightOnly } },
  { name: "dark with more contrast", theme: { ...dark, ...moreDarkOnly } },
];

const ALL_LOOKS = [...NORMAL_LOOKS, ...MORE_LOOKS];

/** Text colors and the surface they are written on. Normal text needs 4.5 to 1. */
const TEXT_PAIRS: Array<[string, string]> = [
  ["--foreground", "--background"],
  ["--foreground", "--card"],
  ["--muted-foreground", "--background"],
  ["--muted-foreground", "--card"],
  ["--muted-foreground", "--muted"],
  ["--muted-foreground", "--secondary"],
  ["--muted-foreground", "--accent"],
  ["--primary-foreground", "--primary"],
  ["--secondary-foreground", "--secondary"],
  ["--accent-foreground", "--accent"],
  ["--destructive", "--background"],
  ["--destructive", "--card"],
  ["--destructive", "--muted"],
  ["--destructive-foreground", "--destructive"],
  ["--success", "--background"],
  ["--success", "--card"],
  ["--success", "--muted"],
  ["--success-foreground", "--success"],
  ["--warning", "--background"],
  ["--warning", "--card"],
  ["--warning", "--muted"],
  ["--warning-foreground", "--warning"],
  ["--info", "--background"],
  ["--info", "--card"],
  ["--info", "--muted"],
  ["--info-foreground", "--info"],
  ["--primary", "--background"],
  ["--primary", "--card"],
  ["--sidebar-foreground", "--sidebar"],
  ["--sidebar-accent-foreground", "--sidebar-accent"],
  ["--sidebar-primary", "--sidebar"],
  ["--popover-foreground", "--popover"],
];

/** The surfaces that a form field can sit on. */
const SURFACES = ["--background", "--card", "--popover", "--muted", "--secondary", "--accent"];

describe("the contrast calculation in this test", () => {
  it("gives 21 to 1 for black on white and 1 to 1 for one color", () => {
    const black = resolve("oklch(0 0 0)");

    const white = resolve("oklch(1 0 0)");

    expect(ratioOf(black, white)).toBeCloseTo(21, 1);

    expect(ratioOf(white, white)).toBe(1);
  });

  it("mixes a see-through color like a browser does", () => {
    const black = resolve("oklch(0 0 0)");

    const mixed = resolve("oklch(1 0 0 / 40%)", black);

    expect(ratioOf(mixed, black)).toBeCloseTo(3.66, 1);
  });
});

describe("the colors of globals.css", () => {
  it("keeps all text pairs at 4.5 to 1 or more in the four looks", () => {
    for (const look of ALL_LOOKS) {
      for (const [front, back] of TEXT_PAIRS) {
        expect(
          contrast(look.theme, front, back),
          `${look.name}: ${front} on ${back}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("makes the grey text 7 to 1 or more when the system asks for more contrast", () => {
    for (const look of MORE_LOOKS) {
      for (const back of ["--background", "--card", "--muted", "--secondary", "--accent"]) {
        expect(
          contrast(look.theme, "--muted-foreground", back),
          `${look.name}: grey text on ${back}`,
        ).toBeGreaterThanOrEqual(7);
      }
    }
  });

  it("draws the edge of a form field at 3 to 1 or more on every surface", () => {
    for (const look of NORMAL_LOOKS) {
      for (const back of SURFACES) {
        expect(
          contrast(look.theme, "--input", back),
          `${look.name}: field edge on ${back}`,
        ).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("draws the edge of a form field at 4.5 to 1 or more when the system asks for more contrast", () => {
    for (const look of MORE_LOOKS) {
      for (const back of SURFACES) {
        expect(
          contrast(look.theme, "--input", back),
          `${look.name}: field edge on ${back}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("keeps the edge at 3 to 1 or more also over the fill of a field that has the page color", () => {
    for (const look of ALL_LOOKS) {
      for (const fill of ["--background", "--card"]) {
        const edge = resolve(look.theme["--input"], resolve(look.theme[fill]));

        for (const back of SURFACES) {
          expect(
            ratioOf(edge, resolve(look.theme[back])),
            `${look.name}: field edge over ${fill} on ${back}`,
          ).toBeGreaterThanOrEqual(3);
        }
      }
    }
  });

  it("keeps the focus ring at 3 to 1 or more on the page and on a card", () => {
    for (const look of ALL_LOOKS) {
      for (const back of ["--background", "--card"]) {
        expect(
          contrast(look.theme, "--ring", back),
          `${look.name}: focus ring on ${back}`,
        ).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("makes the plain border stronger when the system asks for more contrast", () => {
    for (const [index, look] of MORE_LOOKS.entries()) {
      const normal = NORMAL_LOOKS[index].theme;

      for (const back of ["--background", "--card"]) {
        expect(
          contrast(look.theme, "--border", back),
          `${look.name}: border on ${back}`,
        ).toBeGreaterThanOrEqual(3);

        expect(contrast(look.theme, "--border", back)).toBeGreaterThan(
          contrast(normal, "--border", back) + 1,
        );
      }
    }
  });
});

describe("the blocks of globals.css", () => {
  it("has each block once, in an order where the later block wins", () => {
    expect(rootStart).toBeGreaterThan(-1);

    expect(darkStart).toBeGreaterThan(rootStart);

    expect(baseStart).toBeGreaterThan(darkStart);

    expect(moreStart).toBeGreaterThan(darkStart);

    expect(forcedStart).toBeGreaterThan(moreStart);

    expect(printStart).toBeGreaterThan(forcedStart);

    expect(css.match(/@media \(prefers-contrast: more\)/g)?.length).toBe(1);

    expect(css.match(/@media \(forced-colors: active\)/g)?.length).toBe(1);
  });

  it("gives every input, select and textarea the field color for its edge", () => {
    const base = squash(blockAt(css, baseStart));

    expect(base).toContain("input,select,textarea{border-color:var(--input);}");
  });

  it("sets in the dark rule every color that the light rule sets for more contrast", () => {
    const lightNames = Object.keys(moreLightOnly).sort();

    expect(lightNames.length).toBeGreaterThan(3);

    expect(Object.keys(moreDarkOnly).sort()).toEqual(lightNames);

    for (const name of lightNames) {
      expect(light[name], name).toBeDefined();
    }
  });

  it("changes only the edges, the grey text and the focus ring for more contrast", () => {
    const allowed = [
      "--border",
      "--input",
      "--muted-foreground",
      "--ring",
      "--sidebar-border",
      "--sidebar-ring",
    ];

    for (const name of Object.keys(moreLightOnly)) {
      expect(allowed, name).toContain(name);
    }
  });

  it("keeps the sidebar edge and ring equal to the page edge and ring", () => {
    for (const set of [moreLightOnly, moreDarkOnly]) {
      expect(set["--sidebar-border"]).toBe(set["--border"]);

      expect(set["--sidebar-ring"]).toBe(set["--ring"]);
    }
  });

  it("draws the focus ring and the edge of cards again for Windows high contrast mode", () => {
    const forced = squash(forcedBlock);

    expect(forced).toContain(`:focus-visible{outline:2pxsolidHighlight${BANG}important;}`);

    expect(forced).toContain(`main:focus-visible{outline:none${BANG}important;}`);

    for (const slot of [
      "card",
      "dialog-content",
      "alert-dialog-content",
      "dropdown-menu-content",
      "dropdown-menu-sub-content",
    ]) {
      expect(forced).toContain(`[data-slot="${slot}"]`);
    }

    expect(forced).toContain("border:1pxsolidCanvasText;");
  });
});

function sourceFiles(folder: string): string[] {
  const files: string[] = [];

  for (const name of readdirSync(folder)) {
    const path = join(folder, name);

    if (statSync(path).isDirectory()) {
      files.push(...sourceFiles(path));
    } else if (path.endsWith(".tsx")) {
      files.push(path);
    }
  }

  return files;
}

const FILES = [...sourceFiles("components"), ...sourceFiles("app")];

const FIELD_TAGS = new Set(["input", "select", "textarea", "Input", "NativeSelect"]);

/** Fields that give their edge a soft color with a class, which would win over the field color. */
function softEdgeFields(path: string): number[] {
  const source = ts.createSourceFile(
    path,
    readFileSync(path, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );

  const lines: number[] = [];

  function visit(node: ts.Node) {
    if (
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      FIELD_TAGS.has(node.tagName.getText()) &&
      /\bborder-(border|muted|secondary|accent|sidebar-border)\b/.test(node.attributes.getText())
    ) {
      lines.push(source.getLineAndCharacterOfPosition(node.getStart()).line + 1);
    }

    ts.forEachChild(node, visit);
  }

  visit(source);

  return lines;
}

describe("the components", () => {
  it("fills a field with the field color only in the dark theme", () => {
    const problems: string[] = [];

    for (const path of FILES) {
      const classes = readFileSync(path, "utf8").split(/[\s"'`{}]+/);

      for (const name of classes) {
        if (name.includes("bg-input") && name.startsWith("dark:") === false) {
          problems.push(`${path}: ${name}`);
        }

        if (/bg-input\/(30|50|80)$/.test(name)) {
          problems.push(`${path}: ${name}`);
        }
      }
    }

    expect(problems).toEqual([]);
  });

  it("has no form field with a soft edge color that would win over the field color", () => {
    const problems: string[] = [];

    for (const path of FILES) {
      for (const line of softEdgeFields(path)) {
        problems.push(`${path}:${line}`);
      }
    }

    expect(problems).toEqual([]);
  });

  it("uses the field color in the Input and the NativeSelect", () => {
    const input = readFileSync("components/ui/input.tsx", "utf8");

    const select = readFileSync("components/forms/native-select.tsx", "utf8");

    for (const text of [input, select]) {
      expect(text).toContain("border border-input");

      expect(text).toContain("dark:bg-input/10");
    }

    expect(input).toContain("disabled:bg-muted");

    expect(input).toContain("dark:disabled:bg-input/28");
  });

  it("does not use the strong field color for the edge of an outline button", () => {
    const button = readFileSync("components/ui/button.tsx", "utf8");

    expect(button).not.toContain("dark:border-input");

    expect(button).not.toContain("dark:border-foreground");

    expect(button).toContain("dark:bg-input/10 dark:hover:bg-input/18");
  });
});

describe("the help page and the README", () => {
  it("answers the question about the colors", () => {
    const group = HELP_GROUPS.find((entry) => entry.id === "getting-started");

    const item = group?.items.find((entry) => entry.id === "high-contrast");

    expect(item?.question).toBe("Can I make the colors easier to see?");

    expect(item?.answer).toHaveLength(2);

    expect(item?.answer[0]).toContain("Increase contrast");

    expect(item?.answer[1]).toContain("Windows high contrast mode");
  });

  it("puts the new question after the one about a form with a mistake", () => {
    const group = HELP_GROUPS.find((entry) => entry.id === "getting-started");

    const ids = (group?.items ?? []).map((entry) => entry.id);

    expect(ids.indexOf("form-mistakes")).toBeGreaterThan(-1);

    expect(ids.indexOf("high-contrast")).toBe(ids.indexOf("form-mistakes") + 1);
  });

  it("has a README section that names the colors, the media queries and the test", () => {
    const section = readmeSection("Clear colors and high contrast");

    expect(section).toContain("`app/globals.css`");

    expect(section).toContain("`--input`");

    expect(section).toContain("`@media (prefers-contrast: more)`");

    expect(section).toContain("`@media (forced-colors: active)`");

    expect(section).toContain("`dark:bg-input/10`");

    expect(section).toContain("`tests/accessibility/contrast-tokens.test.ts`");

    expect(section).toContain("the migration count stays at 17");
  });
});
