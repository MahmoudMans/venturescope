import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { HELP_GROUPS } from "@/lib/site/help-content";

const read = (path: string) => readFileSync(path, "utf8");

const chart = read("components/charts/accessible-chart.tsx");

const text = read("lib/charts/chart-text.ts");

const comparison = read("components/scenarios/scenario-comparison-chart.tsx");

const simulator = read("components/scenarios/live-scenario-simulator.tsx");

const logout = read("components/app/logout-button.tsx");

const readme = read("README.md");

/** The text without spaces, line breaks and trailing commas, so the layout does not matter. */
const squash = (value: string) => value.replace(/\s+/g, "").replace(/,([)}\]])/g, "$1");

/** True when the squashed text contains the squashed piece. */
const has = (value: string, piece: string) => squash(value).includes(squash(piece));

/** The place of each marker in the squashed text, in the order they are given. */
function positions(value: string, markers: string[]): number[] {
  const body = squash(value);

  return markers.map((marker) => body.indexOf(squash(marker)));
}

/** True when every value was found and each one comes after the one before it. */
function isIncreasing(values: number[]): boolean {
  return values.every((value, index) => value > -1 && (index === 0 || value > values[index - 1]));
}

/** The part of the README that belongs to one "## " heading. */
function readmeSection(title: string): string {
  const start = readme.indexOf(`## ${title}\n`);

  if (start === -1) {
    return "";
  }

  const next = readme.indexOf("\n## ", start + 1);

  return readme.slice(start, next === -1 ? readme.length : next);
}

/** Every .tsx file of the app, with a slash in the path on every system. */
function appFiles(): string[] {
  return ["components", "app"]
    .flatMap((folder) =>
      readdirSync(folder, { recursive: true, encoding: "utf8" })
        .filter((name) => name.endsWith(".tsx"))
        .map((name) => join(folder, name).split("\\").join("/")),
    )
    .sort();
}

describe("the AccessibleChart component", () => {
  it("announces the chart as one picture with a description", () => {
    expect(has(chart, '<div role="img" aria-label={label} className="h-full w-full">')).toBe(true);
  });

  it("is a figure that takes the classes of the caller", () => {
    expect(has(chart, "<figure className={className}>")).toBe(true);

    expect(has(chart, "</figure>")).toBe(true);
  });

  it("puts the chart in the picture and the hidden table after the picture", () => {
    expect(
      isIncreasing(
        positions(chart, [
          '<div role="img"',
          "{children}",
          "</div>",
          '<div className="sr-only">',
          "<table>",
        ]),
      ),
    ).toBe(true);
  });

  it("hides the table from the eyes only, with a box around it", () => {
    expect(has(chart, '<div className="sr-only"><table>')).toBe(true);

    expect(has(chart, "</table></div></figure>")).toBe(true);

    expect(has(chart, '<table className="sr-only">')).toBe(false);

    expect(chart.includes("<table className")).toBe(false);

    expect(chart.includes("aria-hidden")).toBe(false);

    expect(chart.includes("display")).toBe(false);
  });

  it("has a caption, column headers and row headers", () => {
    expect(has(chart, "<caption>{table.caption}</caption>")).toBe(true);

    expect(has(chart, '<th key={column} scope="col">')).toBe(true);

    expect(has(chart, '<th key={cellIndex} scope="row">')).toBe(true);

    expect(has(chart, "<td key={cellIndex}>{cell}</td>")).toBe(true);

    expect(isIncreasing(positions(chart, ["<caption>", "<thead>", "</thead>", "<tbody>"]))).toBe(
      true,
    );
  });

  it("does not need the browser, so a server page can use it too", () => {
    expect(chart.startsWith('"use client"')).toBe(false);

    expect(chart.includes("useState")).toBe(false);
  });
});

describe("the words of the charts", () => {
  it("writes money with the formatter of the app", () => {
    expect(has(text, 'import { formatCurrencyValue } from "@/lib/finance/formatting";')).toBe(true);

    expect(text.match(/formatCurrencyValue\(/g)).toHaveLength(5);

    expect(text.includes("compact")).toBe(false);
  });

  it("does not use a chart library, so it can be tested without a browser", () => {
    expect(text.includes("recharts")).toBe(false);
  });
});

describe("the scenario comparison chart", () => {
  it("builds its words from the scenarios and the currency", () => {
    expect(
      has(comparison, 'import { AccessibleChart } from "@/components/charts/accessible-chart";'),
    ).toBe(true);

    expect(
      has(comparison, 'import { buildScenarioComparisonText } from "@/lib/charts/chart-text";'),
    ).toBe(true);

    expect(has(comparison, "const text = buildScenarioComparisonText(comparison, currency);")).toBe(
      true,
    );
  });

  it("wraps the chart in an AccessibleChart of the same size as before", () => {
    expect(
      has(
        comparison,
        '<AccessibleChart label={text.label} table={text.table} className="h-[360px] w-full">',
      ),
    ).toBe(true);

    expect(
      isIncreasing(
        positions(comparison, [
          "<AccessibleChart",
          "<ResponsiveContainer",
          "</ResponsiveContainer>",
          "</AccessibleChart>",
        ]),
      ),
    ).toBe(true);

    expect(has(comparison, '<div className="h-[360px] w-full">')).toBe(false);
  });
});

describe("the live simulation chart", () => {
  it("builds its words from the months it shows and the currency of the model", () => {
    expect(
      has(simulator, 'import { AccessibleChart } from "@/components/charts/accessible-chart";'),
    ).toBe(true);

    expect(
      has(
        simulator,
        'import { buildRevenueTrajectoryText, spokenUnit } from "@/lib/charts/chart-text";',
      ),
    ).toBe(true);

    expect(
      has(
        simulator,
        "const chartText = buildRevenueTrajectoryText(chartData, baseForecast.currency);",
      ),
    ).toBe(true);

    expect(
      isIncreasing(
        positions(simulator, [
          "const chartData =",
          "const chartText = buildRevenueTrajectoryText(",
          "return (",
          "<AccessibleChart",
        ]),
      ),
    ).toBe(true);
  });

  it("wraps the chart in an AccessibleChart of the same size as before", () => {
    expect(
      has(
        simulator,
        '<AccessibleChart label={chartText.label} table={chartText.table} className="h-[320px]">',
      ),
    ).toBe(true);

    expect(
      isIncreasing(
        positions(simulator, [
          "<AccessibleChart",
          "<ResponsiveContainer",
          "</ResponsiveContainer>",
          "</AccessibleChart>",
        ]),
      ),
    ).toBe(true);

    expect(has(simulator, '<div className="h-[320px]">')).toBe(false);
  });
});

describe("every chart of the app", () => {
  const withCharts = appFiles().filter((file) => read(file).includes("<ResponsiveContainer"));

  it("is found in the three files that draw charts", () => {
    expect(withCharts).toEqual([
      "components/dashboard/financial-dashboard-charts.tsx",
      "components/scenarios/live-scenario-simulator.tsx",
      "components/scenarios/scenario-comparison-chart.tsx",
    ]);
  });

  it("has a name and a description for a screen reader", () => {
    const silent = withCharts.filter((file) => {
      const source = read(file);

      return (
        source.includes("<AccessibleChart") === false && source.includes('role="img"') === false
      );
    });

    expect(silent).toEqual([]);
  });
});

describe("text that is hidden on a small screen", () => {
  it("is never hidden with the hidden class, which removes it for a screen reader too", () => {
    const found: string[] = [];

    for (const file of appFiles()) {
      for (const match of read(file).matchAll(/<span\b[^>]*\bclassName="([^"]*)"/g)) {
        if (match[1].split(/\s+/).includes("hidden")) {
          found.push(`${file}: ${match[1]}`);
        }
      }
    }

    expect(found).toEqual([]);
  });

  it("is shown to the eyes only from the sm size in the Sign out button", () => {
    expect(has(logout, '<span className="sr-only sm:not-sr-only">Sign out</span>')).toBe(true);

    expect(has(logout, '<LogOut className="size-4" aria-hidden="true" />')).toBe(true);

    expect(
      isIncreasing(positions(logout, ["<LogOut", '<span className="sr-only', "Sign out"])),
    ).toBe(true);

    expect(has(logout, "hidden sm:inline")).toBe(false);
  });
});

describe("the help page and the README", () => {
  it("answers the question about a keyboard and a screen reader", () => {
    const group = HELP_GROUPS.find((entry) => entry.id === "getting-started");

    const item = group?.items.find((entry) => entry.id === "keyboard-and-screen-readers");

    expect(item?.question).toBe("Can I use VentureScope with a keyboard or a screen reader?");

    expect(item?.answer).toEqual([
      "Yes. Press Tab at the start of any page and choose Skip to main content to jump past the menu. Press Ctrl+K (Cmd+K on a Mac) to search for a model or a page, use the arrow keys to move and press Enter to open it.",
      "The two scenario charts have a hidden table with the same numbers, so a screen reader can read them. The other charts have a short description, and their numbers are in the tables of the analysis pages. Most messages about a saved change or an error are announced when they appear.",
      "Every box, menu and slider has a name that a screen reader says. The sliders of the live simulation also say their value in words, for example 10 percent.",
    ]);
  });

  it("puts the new question after the one about the spinner", () => {
    const group = HELP_GROUPS.find((entry) => entry.id === "getting-started");

    const ids = (group?.items ?? []).map((entry) => entry.id);

    expect(ids.indexOf("button-spinner")).toBeGreaterThan(-1);

    expect(ids.indexOf("keyboard-and-screen-readers")).toBe(ids.indexOf("button-spinner") + 1);
  });

  it("has a README section that names the files, the other charts and the test", () => {
    const section = readmeSection("Charts, buttons and fields for screen readers");

    const plain = section.replace(/\s+/g, " ");

    expect(section).toContain("`components/charts/accessible-chart.tsx`");

    expect(section).toContain("`lib/charts/chart-text.ts`");

    expect(section).toContain("`tests/accessibility/screen-reader-source.test.ts`");

    expect(section).toContain('`role="img"`');

    expect(section).toContain("`sr-only`");

    expect(section).toContain("`ChartContainer`");

    expect(section).toContain("the migration count stays at 17");

    expect(section).toContain("`tests/accessibility/field-names-source.test.ts`");

    expect(section).toContain("`aria-valuetext`");

    expect(section).toContain("`htmlFor`");

    expect(plain).toContain("A grey placeholder text is not a name.");

    expect(section).toContain("- **Field names:**");

    expect(plain).toContain('for example "10 percent"');

    expect(plain).toContain("because `hidden` removes the name of the button for a screen reader");

    expect(plain).toContain("It also says the unit of the simulator sliders in words.");

    expect(plain).toContain(
      "A person who cannot see the screen must be able to use the charts, the buttons and the fields.",
    );

    expect(plain).toContain(
      "The table sits next to the picture and not inside it, because a screen reader skips everything inside a picture.",
    );

    expect(plain).toContain("The numbers are formatted as money, like in the tables of the app.");

    expect(plain).toContain("Its word is `sr-only sm:not-sr-only` and not `hidden`");

    expect(plain).toContain(
      "a chart made with `ResponsiveContainer` must use `AccessibleChart` or have its own description",
    );
  });
});
