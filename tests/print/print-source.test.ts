import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { HELP_GROUPS } from "@/lib/site/help-content";

const read = (path: string) => readFileSync(path, "utf8");

const button = read("components/app/print-button.tsx");

const appLayout = read("app/(app)/layout.tsx");

const modelLayout = read("app/(app)/projects/[projectId]/layout.tsx");

const pageHeader = read("components/app/page-header.tsx");

const publicShell = read("components/site/public-page-shell.tsx");

const documentPage = read("components/site/document-page.tsx");

const boardPack = read("components/board-pack/board-pack-workspace.tsx");

const readme = read("README.md");

/** The text without spaces, line breaks and trailing commas, so the layout does not matter. */
const squash = (text: string) => text.replace(/\s+/g, "").replace(/,([)}\]])/g, "$1");

/** True when the squashed text contains the squashed piece. */
const has = (text: string, piece: string) => squash(text).includes(squash(piece));

/** The place of each marker in the squashed text, in the order they are given. */
function positions(text: string, markers: string[]): number[] {
  const body = squash(text);

  return markers.map((marker) => body.indexOf(squash(marker)));
}

/** True when every value was found and each one comes after the one before it. */
function isIncreasing(values: number[]): boolean {
  return values.every((value, index) => value > -1 && (index === 0 || value > values[index - 1]));
}

describe("the Print button", () => {
  it("is a client component with a default look of an outline button", () => {
    expect(button.startsWith('"use client";')).toBe(true);

    expect(button).toContain("export function PrintButton({ className }: { className?: string })");

    expect(has(button, '<Button type="button" variant="outline"')).toBe(true);
  });

  it("opens the print window when it is clicked", () => {
    expect(has(button, "onClick={() => window.print()}")).toBe(true);
  });

  it("is not printed itself", () => {
    expect(has(button, 'className={cn("print:hidden", className)}')).toBe(true);
  });

  it("has a visible word and a hidden icon", () => {
    expect(has(button, '<Printer className="size-4" aria-hidden="true" />')).toBe(true);

    expect(has(button, '<Printer className="size-4" aria-hidden="true" />Print</Button>')).toBe(
      true,
    );
  });
});

describe("the app shell", () => {
  it("does not print the side menu or the top bar", () => {
    expect(has(appLayout, 'lg:flex lg:flex-col print:hidden">')).toBe(true);

    expect(
      has(appLayout, 'supports-[backdrop-filter]:bg-background/70 lg:px-8 print:hidden">'),
    ).toBe(true);
  });

  it("gives the page the whole paper and a white background", () => {
    expect(has(appLayout, '<div className="lg:pl-64 print:pl-0">')).toBe(true);

    expect(has(appLayout, '<div className="min-h-svh bg-muted/30 print:bg-white">')).toBe(true);
  });

  it("still prints the page itself", () => {
    expect(has(appLayout, "<main>{children}</main>")).toBe(true);
  });
});

describe("the page header", () => {
  it("does not print the action buttons of a page", () => {
    expect(
      has(pageHeader, '<div className="flex shrink-0 flex-wrap items-center gap-2 print:hidden">'),
    ).toBe(true);
  });
});

describe("the model layout", () => {
  it("has a Print button before the model menu, inside a group that is not printed", () => {
    expect(has(modelLayout, 'import { PrintButton } from "@/components/app/print-button"')).toBe(
      true,
    );

    expect(
      isIncreasing(
        positions(modelLayout, [
          '<div className="flex flex-wrap items-center gap-2 print:hidden">',
          "<PrintButton />",
          "{isOwner ? (",
          "<ProjectActions",
          ") : shared ? (",
          "Open workspace",
        ]),
      ),
    ).toBe(true);
  });

  it("does not print the back button, the menus and the sharing notice", () => {
    expect(has(modelLayout, 'size="icon" className="shrink-0 print:hidden"')).toBe(true);

    expect(
      has(modelLayout, '<div className="relative z-30 border-b px-4 py-3 lg:hidden print:hidden">'),
    ).toBe(true);

    expect(
      has(modelLayout, '<aside className="hidden border-r bg-background lg:block print:hidden">'),
    ).toBe(true);

    expect(has(modelLayout, '<div className="px-5 pt-5 lg:px-8 print:hidden">')).toBe(true);
  });

  it("prints no decorative glow and no grey panel behind the page", () => {
    expect(
      has(
        modelLayout,
        'className="surface-glow pointer-events-none absolute inset-0 opacity-70 print:hidden"',
      ),
    ).toBe(true);

    expect(has(modelLayout, '<section className="min-w-0 bg-muted/20 print:bg-transparent">')).toBe(
      true,
    );
  });

  it("drops the two columns when printing, so the page can use the whole paper", () => {
    expect(
      has(modelLayout, '<div className="grid lg:grid-cols-[220px_minmax(0,1fr)] print:block">'),
    ).toBe(true);
  });

  it("prints the name of the model and its chips as the heading of the page", () => {
    expect(
      has(
        modelLayout,
        '<h1 className="break-words text-xl font-semibold tracking-tight">{project.name}</h1>',
      ),
    ).toBe(true);

    expect(has(modelLayout, "<HeaderChip icon={Coins}>{project.currency}</HeaderChip>")).toBe(true);
  });
});

describe("the public pages", () => {
  it("do not print the main links, the sign-in buttons or the footer links", () => {
    expect(
      has(
        publicShell,
        '<nav aria-label="Main" className="hidden items-center gap-7 md:flex print:hidden">',
      ),
    ).toBe(true);

    expect(has(publicShell, '<div className="flex items-center gap-2 print:hidden">')).toBe(true);

    expect(
      has(
        publicShell,
        'className={cn("flex flex-wrap items-center gap-x-5 gap-y-2 print:hidden", className)}',
      ),
    ).toBe(true);
  });

  it("print the logo of the site", () => {
    expect(
      has(
        publicShell,
        '<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8"> <VentureScopeLogo shortOnPhone />',
      ),
    ).toBe(true);
  });

  it("let a person print the Privacy notice and the Terms", () => {
    expect(has(documentPage, 'import { PrintButton } from "@/components/app/print-button"')).toBe(
      true,
    );

    expect(
      isIncreasing(
        positions(documentPage, [
          "Last updated",
          "<time",
          "</time>",
          "<PrintButton />",
          "</header>",
        ]),
      ),
    ).toBe(true);
  });

  it("do not print the table of contents and use the whole width", () => {
    expect(has(documentPage, 'className="lg:sticky lg:top-24 lg:self-start print:hidden">')).toBe(
      true,
    );

    expect(
      has(
        documentPage,
        '<div className="mt-12 grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)] print:block">',
      ),
    ).toBe(true);
  });
});

describe("the Board pack", () => {
  it("keeps its own Print / Save as PDF button and its own page layout for paper", () => {
    expect(boardPack).toContain("Print / Save as PDF");

    expect(boardPack).toContain("window.print()");

    expect(boardPack).toContain("size: A4;");
  });
});

describe("the help center", () => {
  const group = HELP_GROUPS.find((candidate) => candidate.id === "files-exports-and-imports");

  const item = group?.items.find((candidate) => candidate.id === "print-page");

  it("explains printing, right after the item about exporting numbers", () => {
    expect(group).toBeDefined();

    expect(item).toBeDefined();

    const ids = (group?.items ?? []).map((candidate) => candidate.id);

    expect(ids.indexOf("print-page")).toBe(ids.indexOf("export-report") + 1);
  });

  it("tells a person where the button is and what is printed", () => {
    const text = (item?.answer ?? []).join(" ");

    expect(item?.question).toBe("How do I print a page or save it as a PDF?");

    expect(text).toContain("Choose Print at the top of any model page");

    expect(text).toContain("Privacy and Terms");

    expect(text).toContain("or choose Save as PDF");

    expect(text).toContain("The menus and buttons of the app are not printed");

    expect(text).toContain("also when you use the dark theme");

    expect(text).toContain("landscape");

    expect(text).toContain("Board pack");
  });
});

describe("the README", () => {
  it("describes printing after the not-found pages", () => {
    const order = [
      readme.indexOf("## Not-found pages that help"),
      readme.indexOf("## Print a page"),
      readme.indexOf("## Download your data"),
    ];

    expect(order.every((value) => value > -1)).toBe(true);

    expect(order[0]).toBeLessThan(order[1]);

    expect(order[1]).toBeLessThan(order[2]);
  });

  it("explains the button, what is hidden, the colors and the page breaks", () => {
    const section = readme.slice(
      readme.indexOf("## Print a page"),
      readme.indexOf("## Download your data"),
    );

    expect(section).toContain("`components/app/print-button.tsx`");

    expect(section).toContain("Tailwind `print:hidden` class");

    expect(
      has(section, "The model name and its chips are printed as the heading of the page."),
    ).toBe(true);

    expect(has(section, "a test checks this")).toBe(true);

    expect(has(section, "a table header repeats on every page")).toBe(true);

    expect(section).toContain("the migration count stays at 17");
  });
});
