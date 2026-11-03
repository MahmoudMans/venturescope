import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { OfflineNotice } from "@/components/app/offline-notice";

const markup = renderToStaticMarkup(<OfflineNotice />);

/** The opening tag of the box of the notice, with all its attributes. */
const box = /<div [^>]*data-slot="offline-notice"[^>]*>/.exec(markup)?.[0] ?? "";

describe("OfflineNotice on the server", () => {
  it("draws an empty live region, because the server cannot know the connection", () => {
    expect(box).toContain('role="status"');

    expect(box).toContain('aria-live="polite"');

    expect(markup).not.toContain("You are offline");

    expect(markup).not.toContain("Back online");

    expect(markup).not.toContain("data-state");
  });

  it("is at the bottom of the screen, above the windows of the app, and hidden when printing", () => {
    expect(box).toContain("fixed");

    expect(box).toContain("bottom-3");

    expect(box).toContain("z-[60]");

    expect(box).toContain("print:hidden");
  });

  it("never takes a tap, so it cannot cover a button of the page", () => {
    expect(box).toContain("pointer-events-none");
  });
});
