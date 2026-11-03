import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { HELP_GROUPS } from "@/lib/site/help-content";

const read = (path: string) => readFileSync(path, "utf8");

const state = read("components/app/not-found-state.tsx");

const siteNotFound = read("app/not-found.tsx");

const appNotFound = read("app/(app)/not-found.tsx");

const helpers = read("lib/site/not-found-page.ts");

const shell = read("components/site/public-page-shell.tsx");

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

describe("the public not-found page", () => {
  it("is a server component with a default export", () => {
    expect(siteNotFound.startsWith('"use client"')).toBe(false);

    expect(siteNotFound).toContain("export default function NotFound()");
  });

  it("has a title and no technical wording", () => {
    expect(has(siteNotFound, 'export const metadata: Metadata = { title: "Page not found" }')).toBe(
      true,
    );

    expect(siteNotFound).not.toContain("Resource not found");

    expect(siteNotFound).not.toContain("not available to your account");
  });

  it("keeps the header and footer of the public pages around the message", () => {
    expect(
      has(siteNotFound, 'import { PublicPageShell } from "@/components/site/public-page-shell"'),
    ).toBe(true);

    expect(
      isIncreasing(
        positions(siteNotFound, [
          "<PublicPageShell>",
          '<NotFoundState area="site" />',
          "</PublicPageShell>",
        ]),
      ),
    ).toBe(true);
  });

  it("is inside a page that has the main landmark the skip link needs", () => {
    expect(has(shell, '<main id="main-content" className="flex-1">')).toBe(true);

    expect(siteNotFound).not.toContain("<main");
  });
});

describe("the not-found page inside the app", () => {
  it("is a server component that uses the shared page for the app", () => {
    expect(appNotFound.startsWith('"use client"')).toBe(false);

    expect(appNotFound).toContain("export default function AppNotFound()");

    expect(has(appNotFound, '<NotFoundState area="app" />')).toBe(true);

    expect(
      has(appNotFound, 'import { NotFoundState } from "@/components/app/not-found-state"'),
    ).toBe(true);
  });

  it("does not draw its own main landmark, because the app shell has one", () => {
    expect(appNotFound).not.toContain("<main");

    expect(state).not.toContain("<main");
  });
});

describe("the shared not-found page", () => {
  it("is a client component", () => {
    expect(state.startsWith('"use client";')).toBe(true);

    expect(state).toContain("export function NotFoundState({ area }: { area: NotFoundArea })");
  });

  it("takes its words and buttons from the helper file", () => {
    expect(has(state, "const copy = notFoundCopy(area)")).toBe(true);

    expect(has(state, "const actions = notFoundActions(area)")).toBe(true);

    expect(has(state, "{copy.title}")).toBe(true);

    expect(has(state, "{copy.description}")).toBe(true);

    expect(has(state, "href={actions.primary.href}")).toBe(true);

    expect(has(state, "{actions.primary.label}")).toBe(true);

    expect(has(state, "href={actions.secondary.href}")).toBe(true);

    expect(has(state, "{actions.secondary.label}")).toBe(true);
  });

  it("makes the guess only after the page is on screen", () => {
    expect(
      has(state, "const ready = useSyncExternalStore(subscribeToNothing, isBrowser, isServer)"),
    ).toBe(true);

    expect(has(state, "function isBrowser() { return true; }")).toBe(true);

    expect(has(state, "function isServer() { return false; }")).toBe(true);

    expect(has(state, "return () => undefined")).toBe(true);

    expect(has(state, "const pathname = usePathname()")).toBe(true);

    expect(has(state, 'import { usePathname } from "next/navigation"')).toBe(true);
  });

  it("guesses only outside the app", () => {
    expect(
      has(state, 'const suggestions = area === "site" && ready ? suggestPages(pathname) : []'),
    ).toBe(true);
  });

  it("shows the guess as a list of links in a labelled navigation", () => {
    expect(has(state, "{suggestions.length === 0 ? null : (")).toBe(true);

    expect(has(state, 'aria-label="Pages you may have meant"')).toBe(true);

    expect(has(state, 'data-testid="not-found-suggestions"')).toBe(true);

    expect(has(state, "{NOT_FOUND_SUGGESTION_LABEL}")).toBe(true);

    expect(has(state, "{suggestions.map((page) => (")).toBe(true);

    expect(has(state, "<li key={page.href}>")).toBe(true);

    expect(has(state, "<Link href={page.href}>")).toBe(true);

    expect(has(state, '<Button asChild variant="secondary" size="sm">')).toBe(true);

    expect(has(state, '"w-full max-w-md space-y-3 rounded-xl border bg-muted/40 p-4"')).toBe(true);

    expect(
      has(
        state,
        '<p className="max-w-md text-sm leading-6 text-muted-foreground">{copy.description}</p>',
      ),
    ).toBe(true);

    expect(has(state, "{page.label}")).toBe(true);
  });

  it("never prints the address that was typed", () => {
    expect(state).not.toContain("{pathname}");

    expect(state).not.toContain("window.location");
  });

  it("puts the guess before the buttons and the hint last", () => {
    expect(
      isIncreasing(
        positions(state, [
          "<h1",
          "{copy.description}",
          "{suggestions.length === 0 ? null : (",
          "href={actions.primary.href}",
          "href={actions.secondary.href}",
          "{NOT_FOUND_SEARCH_TIP}",
          'href="/help"',
        ]),
      ),
    ).toBe(true);
  });

  it("uses the icons of the area", () => {
    expect(has(state, 'const PrimaryIcon = area === "app" ? LayoutDashboard : ArrowLeft')).toBe(
      true,
    );

    expect(has(state, 'const SecondaryIcon = area === "app" ? Users : LayoutDashboard')).toBe(true);
  });

  it("hides decorative icons from screen readers", () => {
    expect(has(state, '<div aria-hidden="true" className="flex size-12')).toBe(true);

    expect(has(state, '<PrimaryIcon className="size-4" aria-hidden="true" />')).toBe(true);

    expect(has(state, '<SecondaryIcon className="size-4" aria-hidden="true" />')).toBe(true);

    expect(has(state, '<ArrowRight className="size-4" aria-hidden="true" />')).toBe(true);
  });

  it("shows the error number above the heading", () => {
    expect(has(state, '<p className="text-sm font-semibold text-primary">404</p>')).toBe(true);

    expect(
      isIncreasing(positions(state, ['text-primary">404</p>', "<h1", "{copy.description}"])),
    ).toBe(true);
  });

  it("has one main heading", () => {
    expect(state.match(/<h1/g)?.length).toBe(1);

    expect(has(state, '<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">')).toBe(
      true,
    );
  });

  it("stacks the buttons on a phone and puts them in a row from the small width", () => {
    expect(
      has(
        state,
        '<div className="mt-2 flex flex-col items-center justify-center gap-3 sm:flex-row">',
      ),
    ).toBe(true);
  });

  it("wraps the message in a card inside the app and in a section outside it", () => {
    expect(has(state, 'if (area === "app") {')).toBe(true);

    expect(
      has(state, '<div className="mx-auto w-full max-w-2xl px-5 py-12 lg:px-8 lg:py-20">'),
    ).toBe(true);

    expect(has(state, '<CardContent className="py-10">{content}</CardContent>')).toBe(true);

    expect(
      has(
        state,
        '<section className="surface-glow flex min-h-[60svh] items-center justify-center px-5 py-16 sm:py-24">',
      ),
    ).toBe(true);
  });

  it("gives the app a search tip and the public page a link to Help", () => {
    expect(has(state, 'area === "app" ? (')).toBe(true);

    expect(has(state, "{NOT_FOUND_SEARCH_TIP}")).toBe(true);

    expect(has(state, "Still stuck? Visit the")).toBe(true);

    expect(has(state, 'href="/help"')).toBe(true);

    expect(has(state, "Help center")).toBe(true);
  });
});

describe("the helper file", () => {
  it("has no imports, so it is easy to test", () => {
    expect(helpers).not.toMatch(/^import /m);
  });

  it("keeps the guess to a short list and to short addresses", () => {
    expect(has(helpers, "export const SUGGESTION_LIMIT = 3")).toBe(true);

    expect(has(helpers, "export const SUGGESTION_MAX_PATH_LENGTH = 120")).toBe(true);
  });

  it("allows more mistakes only in longer names", () => {
    expect(has(helpers, "if (name.length >= 8) { return 2; }")).toBe(true);

    expect(has(helpers, "if (name.length >= 4) { return 1; }")).toBe(true);

    expect(has(helpers, "return 0")).toBe(true);
  });

  it("counts two swapped neighbour letters as one mistake", () => {
    expect(
      has(
        helpers,
        "if (i > 1 && j > 1 && first[i - 1] === second[j - 2] && first[i - 2] === second[j - 1])",
      ),
    ).toBe(true);

    expect(has(helpers, "best = Math.min(best, rows[i - 2][j - 2] + 1)")).toBe(true);
  });

  it("compares the whole address, its last part and its first part", () => {
    expect(has(helpers, "[path, parts[parts.length - 1], parts[0]]")).toBe(true);
  });

  it("sorts the best guess first and keeps the order of the list for equal guesses", () => {
    expect(
      has(helpers, "matches.sort((a, b) => a.distance - b.distance || a.order - b.order)"),
    ).toBe(true);
  });
});

describe("the help center", () => {
  const items = HELP_GROUPS[0].items;

  const item = items.find((candidate) => candidate.id === "page-not-found");

  it("explains the page, right after the item about failed pages", () => {
    expect(item).toBeDefined();

    const ids = items.map((candidate) => candidate.id);

    expect(ids.indexOf("page-not-found")).toBe(ids.indexOf("something-went-wrong") + 1);
  });

  it("tells a person what to do and that the answer protects other people", () => {
    const text = (item?.answer ?? []).join(" ");

    expect(item?.question).toContain("could not be found");

    expect(text).toContain("Did you mean");

    expect(text).toContain("Return home");

    expect(text).toContain("Go to dashboard");

    expect(text).toContain("search in the top bar");

    expect(text).toContain("not allowed to open it");
  });
});

describe("the README", () => {
  it("describes the not-found pages after the error pages", () => {
    const body = readme;

    const order = [
      body.indexOf("## Error pages that work"),
      body.indexOf("## Not-found pages that help"),
      body.indexOf("## Download your data"),
    ];

    expect(order.every((value) => value > -1)).toBe(true);

    expect(order[0]).toBeLessThan(order[1]);

    expect(order[1]).toBeLessThan(order[2]);
  });

  it("explains the guess, the privacy rule and the way back", () => {
    expect(readme).toContain("`components/app/not-found-state.tsx`");

    expect(readme).toContain("`lib/site/not-found-page.ts`");

    expect(
      has(
        readme,
        "It keeps the header and footer of the public pages, and the skip link works there.",
      ),
    ).toBe(true);

    expect(readme).toContain("**Did you mean:**");

    expect(readme).toContain("`/dashbord`");

    expect(readme).toContain("two swapped letters");

    expect(readme).toContain("up to three pages");

    expect(readme).toContain("The typed address is not printed on the page.");

    expect(
      has(
        readme,
        "A model that you may not open gets the same page as a model that does not exist.",
      ),
    ).toBe(true);

    expect(has(readme, "outside the app the main button is **Return home**")).toBe(true);

    expect(has(readme, "Inside the app it is **Go to dashboard**.")).toBe(true);

    expect(readme).toContain("the migration count stays at 17");
  });
});
