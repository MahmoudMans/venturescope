import { readFileSync } from "node:fs";

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

const lib = read("lib/forms/paste-number.ts");

describe("the decision about a paste of many cells", () => {
  it("is one exported function with three possible answers", () => {
    expect(lib).toContain("export function decidePaste(raw: string): PasteDecision {");

    expect(squash(lib)).toContain(
      squash(
        'export type PasteDecision = | { action: "leave" } | { action: "set"; value: string } | { action: "block" };',
      ),
    );

    expect(lib).toContain('{ action: "leave" }');

    expect(lib).toContain('{ action: "set", value: fixed }');

    expect(lib).toContain('{ action: "block" } : { action: "set", value }');
  });

  it("splits the cells at tabs and line breaks", () => {
    expect(squash(lib)).toContain(squash("raw.trim().split(/[\\t\\r\\n]+/)"));
  });

  it("takes the first cell and never the digits of the other cells", () => {
    expect(lib).toContain("const first = cells[0];");

    expect(lib).not.toContain("cells.join(");

    expect(lib).not.toContain("cells[1]");
  });

  it("reads a first cell that is a plain number, with the rule of the number box", () => {
    expect(lib).toContain("const PLAIN_NUMBER = /^-?(\\d+(\\.\\d+)?|\\.\\d+)([eE][-+]?\\d+)?$/;");

    expect(lib).toContain("PLAIN_NUMBER.test(first)");
  });

  it("is used by the handler: it stops the paste, and it sets the number only when it has one", () => {
    expect(lib).toContain(
      'const decision = decidePaste(event.clipboardData?.getData("text/plain") ?? "");',
    );

    expect(lib).toContain('if (decision.action === "leave") {');

    expect(lib).toContain('if (decision.action === "set") {');

    expect(lib).toContain("setValue(event.target, decision.value);");

    const leave = lib.indexOf('if (decision.action === "leave") {');

    const stop = lib.indexOf("event.preventDefault();", leave);

    const set = lib.indexOf('if (decision.action === "set") {', leave);

    expect(leave).toBeGreaterThan(-1);

    expect(stop).toBeGreaterThan(leave);

    expect(set).toBeGreaterThan(stop);
  });

  it("uses only plain ASCII characters", () => {
    expect(/^[\x00-\x7f]*$/.test(lib)).toBe(true);
  });
});

describe("the README", () => {
  it("explains the many cells, the first cell and the title case", () => {
    const section = readmeSection("Paste numbers from a spreadsheet");

    for (const piece of [
      "**Many cells:**",
      "tabs or line breaks between the cells",
      "two cells, 100 and 200, became 100200",
      "the box takes the first cell",
      "the other cells are dropped",
      "When the first cell is not a number (a title, for example), nothing is pasted",
      "`decidePaste()`",
      "`tests/forms/paste-many-cells.test.ts`",
      "`tests/forms/paste-many-cells-source.test.ts`",
    ]) {
      expect(squash(section).toLowerCase(), piece).toContain(squash(piece).toLowerCase());
    }
  });

  it("does not talk about 12 month boxes, because the app has no such boxes", () => {
    expect(readme).not.toContain("12 month boxes");

    expect(squash(readmeSection("Paste numbers from a spreadsheet"))).not.toContain(
      squash("is not supported yet"),
    );
  });

  it("does not say that many cells are left to the browser", () => {
    const section = readmeSection("Paste numbers from a spreadsheet");

    expect(squash(section)).not.toContain(squash("text with many cells (tabs or lines)"));
  });
});
