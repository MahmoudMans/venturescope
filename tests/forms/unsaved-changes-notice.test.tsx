import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { UnsavedChangesNotice } from "@/components/forms/unsaved-changes-notice";

describe("UnsavedChangesNotice", () => {
  it("is an empty live region when the form is clean, so a screen reader hears the note later", () => {
    const markup = renderToStaticMarkup(<UnsavedChangesNotice dirty={false} />);

    expect(markup.startsWith('<div role="status"')).toBe(true);

    expect(markup.endsWith("></div>")).toBe(true);

    expect(markup).not.toContain("unsaved");
  });

  it("says in words that there are unsaved changes", () => {
    const markup = renderToStaticMarkup(<UnsavedChangesNotice dirty />);

    expect(markup).toContain('role="status"');

    expect(markup).toContain("You have unsaved changes.");
  });

  it("does not use color alone: the icon is hidden and the words carry the meaning", () => {
    const markup = renderToStaticMarkup(<UnsavedChangesNotice dirty />);

    expect(markup).toContain('aria-hidden="true"');

    expect(markup.replace(/<[^>]*>/g, "").trim()).toBe("You have unsaved changes.");
  });

  it("takes a line of its own on a phone only while it has a note to show", () => {
    expect(renderToStaticMarkup(<UnsavedChangesNotice dirty />)).toContain("max-sm:w-full");

    expect(renderToStaticMarkup(<UnsavedChangesNotice dirty={false} />)).not.toContain(
      "max-sm:w-full",
    );
  });

  it("keeps the icon at its size, also when the words wrap", () => {
    const markup = renderToStaticMarkup(<UnsavedChangesNotice dirty />);

    expect(markup).toContain("size-4 shrink-0");
  });

  it("goes to the left of the save button and is readable on a card", () => {
    const markup = renderToStaticMarkup(<UnsavedChangesNotice dirty />);

    expect(markup).toContain("mr-auto");

    expect(markup).toContain("text-sm");

    expect(markup).toContain("text-warning");
  });
});
