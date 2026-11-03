import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AccessibleChart } from "@/components/charts/accessible-chart";
import type { ChartTextTable } from "@/lib/charts/chart-text";

const TABLE: ChartTextTable = {
  caption: "Revenue of each scenario",
  columns: ["Scenario", "Revenue", "Cash"],
  rows: [
    ["Base Case", "$100", "$50"],
    ["Bull Case", "$200", "$75"],
  ],
};

function html(
  options: { label?: string; table?: ChartTextTable; className?: string } = {},
): string {
  return renderToStaticMarkup(
    <AccessibleChart
      label={options.label ?? "Bar chart of two scenarios"}
      table={options.table ?? TABLE}
      className={options.className}
    >
      <svg data-chart="yes" />
    </AccessibleChart>,
  );
}

/** What is inside the picture: from the start of the role="img" box to its closing tag. */
function picture(markup: string): string {
  const start = markup.indexOf('<div role="img"');

  return markup.slice(start, markup.indexOf("</div>", start) + "</div>".length);
}

describe("AccessibleChart: the picture", () => {
  it("is one figure with a picture inside", () => {
    const markup = html();

    expect(markup.startsWith("<figure")).toBe(true);

    expect(markup.endsWith("</figure>")).toBe(true);

    expect(markup).toContain('<div role="img"');
  });

  it("gives the picture the description as its name", () => {
    expect(html({ label: "Line chart of revenue" })).toContain(
      'aria-label="Line chart of revenue"',
    );
  });

  it("writes special characters of the description safely", () => {
    const markup = html({ label: 'Revenue & "cash" <now>' });

    expect(markup).toContain('aria-label="Revenue &amp; &quot;cash&quot; &lt;now&gt;"');

    expect(markup).not.toContain("<now>");
  });

  it("puts the chart inside the picture", () => {
    expect(picture(html())).toContain('<svg data-chart="yes"');
  });

  it("makes the picture fill the figure, so the chart can use all its height", () => {
    expect(picture(html())).toContain('class="h-full w-full"');
  });

  it("puts the classes of the caller on the figure", () => {
    expect(
      html({ className: "h-[360px] w-full" }).startsWith('<figure class="h-[360px] w-full">'),
    ).toBe(true);
  });

  it("has no class on the figure when none is given", () => {
    expect(html().startsWith("<figure>")).toBe(true);
  });
});

describe("AccessibleChart: the table", () => {
  it("is hidden from the eyes by the box around it", () => {
    expect(html()).toContain('<div class="sr-only"><table>');

    expect(html()).toContain("</table></div></figure>");
  });

  it("does not carry the hidden class itself, because a table ignores width and overflow", () => {
    expect(html()).not.toContain("<table class=");
  });

  it("is next to the picture and not inside it, so a screen reader can read it", () => {
    const markup = html();

    expect(picture(markup)).not.toContain("<table");

    expect(markup.indexOf("</div>")).toBeLessThan(markup.indexOf("<table"));
  });

  it("starts with a caption", () => {
    expect(html()).toContain("<caption>Revenue of each scenario</caption>");
  });

  it("has a header cell for each column", () => {
    const markup = html();

    expect(markup).toContain('<th scope="col">Scenario</th>');

    expect(markup).toContain('<th scope="col">Revenue</th>');

    expect(markup).toContain('<th scope="col">Cash</th>');

    expect(markup.match(/<th scope="col">/g)).toHaveLength(3);
  });

  it("names each row with a header cell and puts the values in normal cells", () => {
    const markup = html();

    expect(markup).toContain('<tr><th scope="row">Base Case</th><td>$100</td><td>$50</td></tr>');

    expect(markup).toContain('<tr><th scope="row">Bull Case</th><td>$200</td><td>$75</td></tr>');
  });

  it("has the rows in the body and the column names in the head", () => {
    const markup = html();

    expect(markup.indexOf("<thead>")).toBeLessThan(markup.indexOf("</thead>"));

    expect(markup.indexOf("</thead>")).toBeLessThan(markup.indexOf("<tbody>"));

    expect(markup.indexOf('<th scope="row">Base Case')).toBeGreaterThan(markup.indexOf("<tbody>"));
  });

  it("comes after the chart", () => {
    const markup = html();

    expect(markup.indexOf("data-chart")).toBeLessThan(markup.indexOf("<table"));
  });

  it("renders an empty body when there are no rows", () => {
    const markup = html({ table: { caption: "Nothing", columns: ["A", "B"], rows: [] } });

    expect(markup).toContain("<tbody></tbody>");

    expect(markup).toContain("<caption>Nothing</caption>");
  });

  it("writes special characters of a cell safely", () => {
    const markup = html({
      table: {
        caption: "x",
        columns: ["Name", "Value"],
        rows: [["<script>alert(1)</script>", "$1"]],
      },
    });

    expect(markup).not.toContain("<script>");

    expect(markup).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("renders two rows with the same name", () => {
    const markup = html({
      table: {
        caption: "x",
        columns: ["Name", "Value"],
        rows: [
          ["Same", "$1"],
          ["Same", "$2"],
        ],
      },
    });

    expect(markup.match(/<tr>/g)).toHaveLength(3);

    expect(markup).toContain("<td>$1</td>");

    expect(markup).toContain("<td>$2</td>");
  });
});
