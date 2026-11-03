import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

const css = read("app/globals.css");

const guard = read("lib/forms/leave-guard.ts");

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

/** The rule of the CSS file for a page with changes that are not saved. */
const RULE = /html\[data-unsaved-changes\],\s*html\[data-unsaved-changes\] body \{([^}]*)\}/;

const rule = RULE.exec(css);

describe("the rule for a swipe down on a page with changes that are not saved", () => {
  it("stops pull to refresh on the page element and on its body", () => {
    expect(rule).not.toBeNull();

    expect(rule?.[1]).toContain("overscroll-behavior-y: contain;");
  });

  it("uses the same attribute as the guard", () => {
    expect(guard).toContain('export const UNSAVED_ATTRIBUTE = "data-unsaved-changes";');

    expect(css).toContain("html[data-unsaved-changes],");

    expect(css).toContain("html[data-unsaved-changes] body {");
  });

  it("is the only place where the page changes how it scrolls at the edge", () => {
    const outside = css.replace(RULE, "");

    expect(outside).not.toContain("overscroll-behavior");
  });
});

describe("the guard", () => {
  it("looks at the page element and does nothing on the server", () => {
    expect(guard).toContain('if (typeof document === "undefined") {');

    expect(guard).toContain("const root = document.documentElement;");
  });

  it("sets the attribute while a form has changes, and takes it away when none has", () => {
    expect(guard).toContain("if (dirtyForms.size > 0) {");

    expect(guard).toContain('root.setAttribute(UNSAVED_ATTRIBUTE, "true");');

    expect(guard).toContain("root.removeAttribute(UNSAVED_ATTRIBUTE);");
  });

  it("updates the page each time a form changes and when everything is forgotten", () => {
    const mark = guard.slice(
      guard.indexOf("export function markUnsaved"),
      guard.indexOf("export function hasUnsavedChanges"),
    );

    const reset = guard.slice(
      guard.indexOf("export function resetLeaveGuard"),
      guard.indexOf("type Asker"),
    );

    expect(mark).toContain("showUnsavedOnPage();");

    expect(reset).toContain("showUnsavedOnPage();");
  });

  it("is reached from the hook when a form is left, so the page is clean again", () => {
    const hook = read("components/forms/use-unsaved-changes-warning.ts");

    expect(hook).toContain("markUnsaved(key, next);");

    expect(hook).toContain("markUnsaved(key, false);");
  });
});

describe("the README", () => {
  it("explains the swipe, the attribute, the rule and what was not tested", () => {
    const section = readmeSection("Do not lose your work");

    for (const piece of [
      "Pull to refresh",
      "Chrome on Android",
      "`markUnsaved()`",
      "`data-unsaved-changes`",
      "`html[data-unsaved-changes]` and its `body`",
      "`overscroll-behavior-y: contain`",
      "`app/globals.css`",
      "A real swipe on a phone was not tested",
      "`tests/forms/pull-to-refresh-source.test.ts`",
      "`tests/forms/leave-guard-page-flag.test.ts`",
    ]) {
      expect(squash(section), piece).toContain(squash(piece));
    }
  });

  it("keeps the section about unsaved work before the section about the download", () => {
    const first = readme.indexOf("## Do not lose your work");

    const second = readme.indexOf("## Download your data");

    expect(first).toBeGreaterThan(-1);

    expect(second).toBeGreaterThan(first);
  });
});
