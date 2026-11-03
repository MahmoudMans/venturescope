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

const lib = read("lib/forms/paste-number.ts");

describe("the reader of pasted numbers", () => {
  it("keeps the number as text, so a long number loses no digit", () => {
    expect(lib).not.toContain("parseFloat");

    expect(lib).not.toContain("parseInt");

    expect(/\bNumber\(/.test(lib)).toBe(false);
  });

  it("uses only plain ASCII characters, with escapes for the signs", () => {
    expect(/^[\x00-\x7f]*$/.test(lib)).toBe(true);

    expect(lib).toContain("\\u2212");

    expect(lib).toContain("\\u00a0");

    expect(lib).toContain("\\u202f");
  });

  it("works only in a number box that a person can type in", () => {
    expect(lib).toContain('box.tagName === "INPUT"');

    expect(lib).toContain('box.type === "number"');

    expect(lib).toContain("box.readOnly !== true");

    expect(lib).toContain("box.disabled !== true");
  });

  it("sets the value with the setter of the browser and sends an input event", () => {
    expect(lib).toContain('Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")');

    expect(lib).toContain('new Event("input", { bubbles: true })');
  });

  it("listens to paste in the capture phase, before React, and can stop", () => {
    expect(lib).toContain('doc.addEventListener("paste", onPaste, true);');

    expect(lib).toContain('doc.removeEventListener("paste", onPaste, true)');
  });

  it("starts from the real document of the browser, and from nothing on the server", () => {
    expect(lib).toContain('if (typeof document === "undefined") {');

    expect(lib).toContain("return { doc: document, setValue: setBrowserValue };");
  });

  it("leaves a paste to the browser when the text is already right", () => {
    expect(lib).toContain("return result === raw.trim() ? null : result;");
  });
});

describe("the component and the place", () => {
  const component = read("components/forms/number-paste-fix.tsx");

  it("is a client component that starts the handler once and ends it, and draws nothing", () => {
    expect(component.startsWith('"use client";')).toBe(true);

    expect(component).toContain("useEffect(() => installNumberPaste(), []);");

    expect(component).toContain("return null;");
  });

  it("is once in the root layout, inside the theme, so every page has it", () => {
    const layout = read("app/layout.tsx");

    expect(layout).toContain(
      'import { NumberPasteFix } from "@/components/forms/number-paste-fix";',
    );

    const open = layout.indexOf("<ThemeProvider");

    const placed = layout.indexOf("<NumberPasteFix />");

    const close = layout.indexOf("</ThemeProvider>");

    expect(placed).toBeGreaterThan(open);

    expect(placed).toBeLessThan(close);
  });

  it("is not drawn in another place, so the page has one handler", () => {
    const files = sourceFiles(["app", "components"], [".tsx"]).filter((file) =>
      read(file).includes("<NumberPasteFix"),
    );

    expect(files).toEqual(["app/layout.tsx"]);
  });

  it("is the only place that reads a paste, so no box has its own handler", () => {
    const files = sourceFiles(["app", "components"], [".tsx"]).filter((file) =>
      read(file).includes("onPaste"),
    );

    expect(files).toEqual([]);
  });
});

describe("the README", () => {
  it("explains the problem, the fix, the formats, the two rules and the limits", () => {
    const section = readmeSection("Paste numbers from a spreadsheet");

    for (const piece of [
      'Checked in Chromium: "1 250,50" became 125050',
      "125050",
      "100 times too big",
      "lost its minus sign",
      "`parsePastedNumber()`",
      "`lib/forms/paste-number.ts`",
      "`installNumberPaste()`",
      "`NumberPasteFix`",
      "`components/forms/number-paste-fix.tsx`",
      "`app/layout.tsx`",
      "1,250,000.50",
      "1 250,50",
      "1.250.000,50",
      "1250,50",
      "TND, USD or DT",
      "brackets",
      "one comma and exactly three digits (1,250) is a group of thousands",
      "One dot (1.250) is a decimal point",
      "left to the browser",
      "`input` event",
      "The cells of one paste are not spread over many boxes: each box takes one number",
      "`tests/forms/paste-number.test.ts`",
      "`tests/forms/paste-number-source.test.ts`",
      "the migration count stays at 17",
    ]) {
      expect(squash(section).toLowerCase(), piece).toContain(squash(piece).toLowerCase());
    }
  });

  it("comes after the section about being offline and before the download", () => {
    const first = readme.indexOf("## The app tells you when you are offline");

    const second = readme.indexOf("## Paste numbers from a spreadsheet");

    const third = readme.indexOf("## Download your data");

    expect(first).toBeGreaterThan(-1);

    expect(second).toBeGreaterThan(first);

    expect(third).toBeGreaterThan(second);
  });
});
