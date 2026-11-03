import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { HELP_GROUPS } from "@/lib/site/help-content";

const read = (path: string) => readFileSync(path, "utf8");

const state = read("components/app/error-state.tsx");

const siteError = read("app/error.tsx");

const appError = read("app/(app)/error.tsx");

const globalError = read("app/global-error.tsx");

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

const pages = [
  ["app/error.tsx", siteError],
  ["app/(app)/error.tsx", appError],
  ["app/global-error.tsx", globalError],
] as const;

describe("every error page", () => {
  it("is a client component with a default export", () => {
    for (const [name, text] of pages) {
      expect(text.startsWith('"use client";'), name).toBe(true);

      expect(text, name).toContain("export default function");
    }
  });

  it("asks Next.js to load the page again with retry, not reset", () => {
    for (const [name, text] of pages) {
      expect(has(text, "retry: () => void"), name).toBe(true);

      expect(text, name).not.toContain("reset");
    }
  });

  it("accepts any thrown value and never reads its message", () => {
    for (const [name, text] of [...pages, ["error-state.tsx", state] as const]) {
      expect(has(text, "error: unknown"), name).toBe(true);

      expect(text, name).not.toContain("error.message");

      expect(text, name).not.toContain("error.stack");

      expect(text, name).not.toContain("error.name");
    }
  });
});

describe("shared error state", () => {
  it("is a client component", () => {
    expect(state.startsWith('"use client";')).toBe(true);
  });

  it("takes its words from the helper and its reference from the digest", () => {
    expect(has(state, "const copy = errorPageCopy(area);")).toBe(true);

    expect(has(state, "const reference = errorReference(error);")).toBe(true);

    expect(has(state, "{copy.title}")).toBe(true);

    expect(has(state, "{copy.description}")).toBe(true);

    expect(has(state, "{ERROR_REFERENCE_HINT}")).toBe(true);
  });

  it("writes only the reference to the console", () => {
    expect(has(state, "console.error(`VentureScope ${scope} error`, { digest: reference });")).toBe(
      true,
    );
  });

  it("writes to the console once, and moves the focus once, not at every redraw", () => {
    expect(
      has(
        state,
        "console.error(`VentureScope ${scope} error`, { digest: reference }); }, [scope, reference]);",
      ),
    ).toBe(true);

    expect(has(state, "titleRef.current?.focus({ preventScroll: true }); }, []);")).toBe(true);
  });

  it("moves the focus to the title when it appears", () => {
    expect(has(state, "<h1 ref={titleRef} tabIndex={-1}")).toBe(true);

    expect(has(state, "titleRef.current?.focus({ preventScroll: true });")).toBe(true);
  });

  it("shows the reference with a copy button only when there is one", () => {
    expect(has(state, "{reference === null ? null : (")).toBe(true);

    expect(has(state, 'data-testid="error-reference"')).toBe(true);

    expect(has(state, "await navigator.clipboard.writeText(value); setCopied(true);")).toBe(true);

    expect(has(state, "onClick={() => copyReference(reference)}")).toBe(true);

    expect(has(state, '{copied ? "Copied" : "Copy"}')).toBe(true);

    expect(has(state, "window.setTimeout(() => setCopied(false), 2500);")).toBe(true);

    expect(has(state, '<Button type="button" variant="outline" size="sm"')).toBe(true);
  });

  it("has Try again, a way back and Help", () => {
    expect(has(state, '<Button type="button" size="lg" onClick={() => retry()}>')).toBe(true);

    expect(state).toContain("Try again");

    expect(has(state, 'const HomeIcon = area === "app" ? LayoutDashboard : ArrowLeft;')).toBe(true);

    expect(has(state, "<Link href={copy.homeHref}>")).toBe(true);

    expect(has(state, '<Link href="/help">')).toBe(true);

    expect(
      isIncreasing(positions(state, ["Try again", "{copy.homeLabel}", '<Link href="/help">'])),
    ).toBe(true);
  });

  it("fits inside the app menu, or fills the whole page outside it", () => {
    expect(has(state, 'if (area === "app") {')).toBe(true);

    expect(state).toContain("mx-auto flex w-full max-w-2xl justify-center");

    expect(state).toContain("<main");

    expect(state).toContain("min-h-svh");
  });
});

describe("page outside the app", () => {
  it("uses the shared state for the public area", () => {
    expect(
      has(siteError, '<ErrorState area="site" scope="page" error={error} retry={retry} />'),
    ).toBe(true);
  });
});

describe("page inside the app", () => {
  it("uses the shared state for the app area", () => {
    expect(
      has(appError, '<ErrorState area="app" scope="app page" error={error} retry={retry} />'),
    ).toBe(true);
  });

  it("no longer says that a workspace could not load", () => {
    expect(appError).not.toContain("workspace");
  });
});

describe("page for the root layout", () => {
  it("loads the styles itself, as the first import", () => {
    expect(globalError.startsWith('"use client";\n\nimport "./globals.css";')).toBe(true);
  });

  it("sets the two font variables that the root layout would have set", () => {
    expect(globalError).toContain('"--font-geist-sans":');

    expect(globalError).toContain('"--font-geist-mono":');

    expect(has(globalError, "style={FONT_VARIABLES}")).toBe(true);
  });

  it("has its own html and body, a language and a title", () => {
    expect(
      has(globalError, '<html lang="en" style={FONT_VARIABLES} suppressHydrationWarning>'),
    ).toBe(true);

    expect(
      has(globalError, '<body className="min-h-svh bg-background text-foreground antialiased">'),
    ).toBe(true);

    expect(globalError).toContain("<title>VentureScope could not start</title>");
  });

  it("uses only plain elements and the helper, so nothing that could fail is used again", () => {
    expect(globalError).not.toContain("@/components");

    expect(globalError).not.toContain("next/link");

    expect(globalError).not.toContain("lucide-react");

    expect(has(globalError, '} from "@/lib/site/error-page";')).toBe(true);
  });

  it("picks light or dark from the saved choice, then from the system", () => {
    expect(
      isIncreasing(
        positions(globalError, [
          'window.localStorage.getItem("theme")',
          'window.matchMedia("(prefers-color-scheme: dark)").matches',
          'document.documentElement.classList.toggle("dark", dark);',
        ]),
      ),
    ).toBe(true);

    expect(has(globalError, "const dark = resolveDarkTheme(")).toBe(true);
  });

  it("does not stop when the saved choice cannot be read", () => {
    expect(
      has(globalError, "} catch { // Storage can be blocked. Then the system setting decides. }"),
    ).toBe(true);

    expect(
      isIncreasing(
        positions(globalError, ["try {", 'window.localStorage.getItem("theme")', "} catch {"]),
      ),
    ).toBe(true);
  });

  it("shows the same words and the reference as the other pages", () => {
    expect(has(globalError, 'const copy = errorPageCopy("global");')).toBe(true);

    expect(has(globalError, "const reference = errorReference(error);")).toBe(true);

    expect(has(globalError, "{reference === null ? null : (")).toBe(true);

    expect(has(globalError, "onClick={() => retry()}")).toBe(true);

    expect(has(globalError, "href={copy.homeHref}")).toBe(true);

    expect(has(globalError, "{ERROR_REFERENCE_HINT}")).toBe(true);
  });

  it("writes only the reference to the console", () => {
    expect(
      has(
        globalError,
        'console.error("VentureScope global application error", { digest: reference });',
      ),
    ).toBe(true);
  });
});

describe("help and readme", () => {
  const items = HELP_GROUPS.flatMap((group) => group.items);

  const item = items.find((candidate) => candidate.id === "something-went-wrong");

  it("answers the question in the first group", () => {
    expect(HELP_GROUPS[0].items.map((candidate) => candidate.id)).toContain("something-went-wrong");

    expect(item?.question).toBe("A page says something went wrong. What should I do?");
  });

  it("uses the words of the buttons", () => {
    const text = (item?.answer ?? []).join(" ");

    for (const words of [
      "Try again",
      "Copy",
      "reference code",
      "server log",
      "never shows technical",
    ]) {
      expect(text, words).toContain(words);
    }
  });

  it("describes the error pages in the readme", () => {
    const start = readme.indexOf("## Error pages that work");

    const end = readme.indexOf("\n## ", start + 1);

    expect(start).toBeGreaterThan(-1);

    const section = squash(readme.slice(start, end));

    for (const words of [
      "app/(app)/error.tsx",
      "app/error.tsx",
      "app/global-error.tsx",
      "retry",
      "globals.css",
      "digest",
      "migration count stays at 17",
      "Three levels:",
      "the message of the error is never shown or logged",
      "Try again",
      "Return home",
    ]) {
      expect(section, words).toContain(squash(words));
    }
  });
});
