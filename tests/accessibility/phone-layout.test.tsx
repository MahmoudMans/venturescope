import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { VentureScopeLogo } from "@/components/brand/venturescope-logo";
import { Badge } from "@/components/ui/badge";

// The link of Next.js needs the router. A plain anchor is enough to see its name and classes.
vi.mock("next/link", async () => {
  const { createElement } = await import("react");

  return {
    default: ({ href, children, ...rest }: { href: string; children: ReactNode }) =>
      createElement("a", { href, ...rest }, children),
  };
});

describe("Badge", () => {
  it("is at least 20px high and grows with its text", () => {
    const markup = renderToStaticMarkup(<Badge>Base</Badge>);

    expect(markup).toContain("min-h-5");

    expect(markup).toContain("max-w-full");

    expect(markup).toContain("py-0");

    expect(markup).not.toMatch(/[\s"]h-5[\s"]/);
  });

  it("keeps a short label on one line", () => {
    expect(renderToStaticMarkup(<Badge>Base</Badge>)).toContain("whitespace-nowrap");
  });

  it("still takes the classes of the page, for example to hide on a phone", () => {
    const markup = renderToStaticMarkup(<Badge className="hidden sm:inline-flex">Demo</Badge>);

    expect(markup).toContain("sm:inline-flex");
  });
});

describe("VentureScopeLogo", () => {
  it("shows the name on every screen by default", () => {
    const markup = renderToStaticMarkup(<VentureScopeLogo />);

    expect(markup).toContain("VentureScope</span>");

    expect(markup).toContain("Financial Intelligence");

    expect(markup).not.toContain("max-[360px]:hidden");
  });

  it("hides the name below 360px when asked, and keeps the icon and the link name", () => {
    const markup = renderToStaticMarkup(<VentureScopeLogo shortOnPhone />);

    expect(markup).toContain('aria-label="VentureScope home"');

    expect(markup).toContain("max-[360px]:hidden");

    expect(markup.indexOf("max-[360px]:hidden")).toBeLessThan(
      markup.indexOf("VentureScope</span>"),
    );

    expect(markup).toContain("size-9");
  });

  it("puts the hiding class on the box of the words, not on the icon", () => {
    const markup = renderToStaticMarkup(<VentureScopeLogo shortOnPhone />);

    const hidden = markup.indexOf("max-[360px]:hidden");

    const icon = markup.indexOf("size-9");

    expect(icon).toBeLessThan(hidden);

    expect(markup.slice(markup.lastIndexOf("<div", hidden), hidden)).toContain("flex-col");
  });

  it("has no words at all in the compact form", () => {
    const markup = renderToStaticMarkup(<VentureScopeLogo compact shortOnPhone />);

    expect(markup).not.toContain("Financial Intelligence");

    expect(markup).not.toContain("max-[360px]:hidden");
  });
});
