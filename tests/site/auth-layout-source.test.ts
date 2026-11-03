import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const layout = readFileSync("app/(auth)/layout.tsx", "utf8");

/** The text without spaces, line breaks and trailing commas, so the layout does not matter. */
const squash = (text: string) => text.replace(/\s+/g, "").replace(/,([)}\]])/g, "$1");

/** True when the squashed text contains the squashed piece. */
const has = (text: string, piece: string) => squash(text).includes(squash(piece));

describe("sign-in layout on small screens", () => {
  it("keeps the small logo in the top corner and hides it on large screens", () => {
    expect(has(layout, '<div className="absolute left-5 top-5 lg:hidden">')).toBe(true);
  });

  it("leaves room under the small logo, so the form card never starts below it", () => {
    expect(
      has(layout, '<section className="surface-glow relative flex px-5 pb-10 pt-20 lg:py-12">'),
    ).toBe(true);
  });

  it("centers the form in the free space, also when the form is taller than the screen", () => {
    expect(has(layout, '<div className="m-auto w-full max-w-md">{children}</div>')).toBe(true);
  });

  it("does not use the old centering that let a tall form slide under the logo", () => {
    expect(has(layout, "relative flex items-center justify-center px-5 py-12")).toBe(false);
  });
});

describe("sign-in layout on large screens", () => {
  it("puts a gap between the logo, the text and the footer of the left panel", () => {
    expect(has(layout, "lg:flex lg:flex-col lg:gap-10")).toBe(true);
  });
});
