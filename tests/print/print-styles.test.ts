import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const css = readFileSync("app/globals.css", "utf8");

/** The text without spaces and line breaks, so the layout of the file does not matter. */
const squash = (text: string) => text.replace(/\s+/g, "");

/** The text between the braces of the block that starts at the given place. */
function blockAt(source: string, start: number): string {
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

/** The custom properties (the colors) declared in a block, by name. */
function tokens(block: string): Record<string, string> {
  const found: Record<string, string> = {};

  for (const match of block.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) {
    found[match[1]] = match[2].trim();
  }

  return found;
}

const lightBlock = blockAt(css, css.indexOf("\n:root {"));

const darkStart = css.indexOf("\n.dark {");

const darkBlock = blockAt(css, darkStart);

const printStart = css.indexOf("@media print");

const printBlock = blockAt(css, printStart);

const printDarkBlock = blockAt(printBlock, printBlock.indexOf(".dark {"));

describe("the print block in globals.css", () => {
  it("exists once, after the dark theme, so that it wins", () => {
    expect(darkStart).toBeGreaterThan(-1);

    expect(printStart).toBeGreaterThan(darkStart);

    expect(css.match(/@media print/g)?.length).toBe(1);
  });

  it("sets every color of the dark theme again to its light value", () => {
    const light = tokens(lightBlock);

    const dark = tokens(darkBlock);

    const printed = tokens(printDarkBlock);

    expect(Object.keys(dark).length).toBeGreaterThan(30);

    for (const name of Object.keys(dark)) {
      expect(printed[name], name).toBeDefined();

      expect(printed[name], name).toBe(light[name]);
    }
  });

  it("does not set a color that the dark theme does not have", () => {
    const dark = tokens(darkBlock);

    const printed = tokens(printDarkBlock);

    expect(Object.keys(printed).sort()).toEqual(Object.keys(dark).sort());
  });

  it("keeps the light colors really light and the text dark", () => {
    const printed = tokens(printDarkBlock);

    expect(printed["--background"]).toBe("oklch(0.984 0.003 265)");

    expect(printed["--card"]).toBe("oklch(1 0 0)");

    expect(printed["--foreground"]).toBe("oklch(0.21 0.03 265)");

    expect(printed["--muted-foreground"]).toBe("oklch(0.5 0.025 265)");
  });

  it("forces the light color scheme, which the theme sets inline on the page", () => {
    expect(squash(printBlock)).toContain("html{color-scheme:light\u0021important");
  });

  it("asks the browser to print backgrounds such as badges and table headers", () => {
    expect(squash(printBlock)).toMatch(/[{;]print-color-adjust:exact;/);

    expect(squash(printBlock)).toMatch(/[{;]-webkit-print-color-adjust:exact;/);
  });

  it("does not cut a card, a figure or a table row between two pages", () => {
    expect(squash(printBlock)).toContain('[data-slot="card"],figure,tr{break-inside:avoid;}');
  });

  it("does not leave a heading alone at the bottom of a page", () => {
    expect(squash(printBlock)).toContain("h1,h2,h3{break-after:avoid;}");
  });

  it("repeats the header of a table on every page", () => {
    expect(squash(printBlock)).toContain("thead{display:table-header-group;}");
  });

  it("sets a margin for the paper outside the media block", () => {
    const outside = css.slice(0, printStart);

    expect(squash(outside)).toContain("@page{margin:12mm;}");
  });
});
