import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FinancialTable } from "@/components/financial/financial-table";
import { ScrollRegion } from "@/components/ui/scroll-region";

function html(props: { label?: string; className?: string } = {}): string {
  return renderToStaticMarkup(
    <ScrollRegion label={props.label ?? "Monthly variance"} className={props.className}>
      <table>
        <tbody>
          <tr>
            <td>Cash</td>
          </tr>
        </tbody>
      </table>
    </ScrollRegion>,
  );
}

/** The opening tag of the box that scrolls, with all its attributes. */
function scroller(markup: string): string {
  return /<div [^>]*data-slot="scroll-region"[^>]*>/.exec(markup)?.[0] ?? "";
}

/** The opening tag of the box that draws the focus line. */
function focusBox(markup: string): string {
  return /<div [^>]*data-slot="scroll-region-focus"[^>]*>/.exec(markup)?.[0] ?? "";
}

/** The opening tag of the box around the two. */
function frame(markup: string): string {
  return /<div [^>]*data-slot="scroll-region-frame"[^>]*>/.exec(markup)?.[0] ?? "";
}

describe("ScrollRegion", () => {
  it("is a box that can get the keyboard focus, with a name for a screen reader", () => {
    const tag = scroller(html());

    expect(tag).toContain('tabindex="0"');

    expect(tag).toContain('role="region"');

    expect(tag).toContain('aria-label="Monthly variance"');
  });

  it("scrolls sideways and keeps a swipe at the end inside the box", () => {
    const tag = scroller(html());

    expect(tag).toContain("overflow-x-auto");

    expect(tag).toContain("overscroll-x-contain");
  });

  it("shows the table inside the box that scrolls", () => {
    const markup = html();

    const tag = scroller(markup);

    const start = markup.indexOf(tag) + tag.length;

    const end = markup.indexOf("</table></div>");

    expect(markup.slice(start, start + "<table>".length)).toBe("<table>");

    expect(markup.slice(start, end)).toContain("<td>Cash</td>");

    expect(end).toBeGreaterThan(start);

    expect(end).toBeLessThan(markup.indexOf('data-slot="scroll-region-focus"'));
  });

  it("adds the classes of the caller to the box that scrolls, after its own", () => {
    const markup = html({ className: "max-h-72 overflow-y-auto" });

    const tag = scroller(markup);

    expect(tag).toContain("overflow-x-auto");

    expect(tag).toContain("max-h-72");

    expect(tag).toContain("overflow-y-auto");

    expect(tag.indexOf("overflow-x-auto")).toBeLessThan(tag.indexOf("max-h-72"));

    expect(frame(markup)).not.toContain("max-h-72");

    expect(focusBox(markup)).not.toContain("max-h-72");
  });

  it("passes other attributes to the box that scrolls", () => {
    const markup = renderToStaticMarkup(
      <ScrollRegion label="Preview" id="preview-box" data-testid="preview">
        text
      </ScrollRegion>,
    );

    expect(scroller(markup)).toContain('id="preview-box"');

    expect(scroller(markup)).toContain('data-testid="preview"');

    expect(frame(markup)).not.toContain("preview-box");
  });

  it("keeps its name, its role and its focus when a caller tries to change them", () => {
    const sneaky = { role: "presentation", tabIndex: -1, "aria-label": "Other" } as object;

    const markup = renderToStaticMarkup(
      <ScrollRegion label="Monthly variance" {...sneaky}>
        text
      </ScrollRegion>,
    );

    const tag = scroller(markup);

    expect(tag).toContain('role="region"');

    expect(tag).toContain('tabindex="0"');

    expect(tag).toContain('aria-label="Monthly variance"');

    expect(markup).not.toContain("presentation");

    expect(markup).not.toContain('aria-label="Other"');
  });
});

describe("ScrollRegion: the focus line", () => {
  it("is drawn by a second box on top, which a screen reader does not see and a click goes through", () => {
    const tag = focusBox(html());

    expect(tag).toContain('aria-hidden="true"');

    expect(tag).toContain("pointer-events-none");

    expect(tag).toContain("absolute inset-0");
  });

  it("is above a fixed column or header, which the line of the box itself is not", () => {
    // The sticky cells of the tables have z-index 10 and 20.
    expect(focusBox(html())).toContain("z-30");

    expect(frame(html())).toContain("isolate");

    expect(frame(html())).toContain("relative");
  });

  it("shows only when the box that scrolls has the focus from the keyboard", () => {
    const tag = focusBox(html());

    expect(tag).toContain("opacity-0");

    expect(tag).toContain("peer-focus-visible:opacity-100");

    expect(scroller(html())).toContain("peer");
  });

  it("is a 2px line inside the edge, in the ring color, so the card around cannot cut it", () => {
    const tag = focusBox(html());

    expect(tag).toContain("outline-2");

    expect(tag).toContain("-outline-offset-2");

    expect(tag).toContain("outline-ring");
  });

  it("replaces the line of the browser, so there are not two", () => {
    expect(scroller(html())).toContain("outline-none");
  });

  it("comes after the box that scrolls, because a peer rule only reaches a later box", () => {
    const markup = html();

    expect(markup.indexOf('data-slot="scroll-region"')).toBeLessThan(
      markup.indexOf('data-slot="scroll-region-focus"'),
    );

    expect(markup.startsWith('<div data-slot="scroll-region-frame"')).toBe(true);
  });
});

describe("FinancialTable", () => {
  const columns = [
    { key: "2026-01", label: "Jan 2026" },
    { key: "2026-02", label: "Feb 2026" },
  ];

  const rows = [{ label: "Revenue", values: ["$100", "$120"] }];

  it("is a scroll region that is named like the caption of the table", () => {
    const markup = renderToStaticMarkup(
      <FinancialTable caption="Monthly forecast" columns={columns} rows={rows} />,
    );

    const tag = scroller(markup);

    expect(tag).toContain('role="region"');

    expect(tag).toContain('tabindex="0"');

    expect(tag).toContain('aria-label="Monthly forecast"');

    expect(markup).toContain('<caption class="sr-only">Monthly forecast</caption>');
  });

  it("keeps the table inside the box and the box inside the rounded card", () => {
    const markup = renderToStaticMarkup(
      <FinancialTable caption="Monthly forecast" columns={columns} rows={rows} />,
    );

    expect(markup.startsWith('<div class="overflow-hidden rounded-xl border bg-background">')).toBe(
      true,
    );

    expect(markup.indexOf('data-slot="scroll-region"')).toBeLessThan(markup.indexOf("<table"));

    expect(markup.indexOf("</table>")).toBeLessThan(
      markup.indexOf('data-slot="scroll-region-focus"'),
    );
  });
});
