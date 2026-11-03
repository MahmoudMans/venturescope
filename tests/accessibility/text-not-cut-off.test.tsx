import { Coins } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FinancialKpiCard } from "@/components/financial/financial-kpi-card";

function render(value: string, detail?: string) {
  return renderToStaticMarkup(
    <FinancialKpiCard label="Break-even" value={value} detail={detail} icon={Coins} />,
  );
}

describe("FinancialKpiCard", () => {
  it("shows the whole value and wraps it, so a long value is never cut", () => {
    const markup = render("September 2028");

    expect(markup).toContain("September 2028");

    expect(markup).toContain("break-words");

    expect(markup).not.toContain("truncate");

    expect(markup).not.toContain("text-ellipsis");
  });

  it("keeps a very long money value whole", () => {
    expect(render("-IDR 124,500,000,000")).toContain("-IDR 124,500,000,000");
  });

  it("hides the icon in a narrow card and shows it in a wide one", () => {
    const markup = render("TND 12.4M");

    const icon = /<div class="([^"]*size-9[^"]*)"/.exec(markup)?.[1] ?? "";

    expect(icon.split(" ")).toContain("hidden");

    expect(icon.split(" ")).toContain("@min-[11rem]/card-header:flex");
  });

  it("hides the icon from a screen reader in every case", () => {
    expect(render("TND 12.4M")).toContain('aria-hidden="true"');
  });

  it("puts the header in a container, so the icon can ask for its width", () => {
    expect(render("TND 12.4M")).toContain("@container/card-header");
  });

  it("keeps the label and the detail", () => {
    const markup = render("TND 12.4M", "First month with a positive EBITDA.");

    expect(markup).toContain("Break-even");

    expect(markup).toContain("First month with a positive EBITDA.");
  });

  it("draws no detail when there is none", () => {
    expect(render("TND 12.4M")).not.toContain("text-xs leading-5");
  });
});
