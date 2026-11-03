"use client";

import "./globals.css";

import { type CSSProperties, useEffect } from "react";

import {
  ERROR_REFERENCE_HINT,
  errorPageCopy,
  errorReference,
  resolveDarkTheme,
} from "@/lib/site/error-page";

/**
 * The fonts of the app are set by the root layout, which is not used here. Without these two
 * values the page would fall back to a serif font.
 */
const FONT_VARIABLES = {
  "--font-geist-sans":
    'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  "--font-geist-mono":
    'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
} as CSSProperties;

/**
 * The last safety net: it replaces the whole page when the root layout itself fails. Next.js does
 * not load the layout here, so this file loads the styles itself, picks light or dark by itself
 * and uses only plain elements, so nothing that could have failed is used again.
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  const copy = errorPageCopy("global");

  const reference = errorReference(error);

  useEffect(() => {
    // Only the reference is written to the console. The message of the error stays hidden.
    console.error("VentureScope global application error", { digest: reference });
  }, [reference]);

  useEffect(() => {
    let stored: string | null = null;

    try {
      stored = window.localStorage.getItem("theme");
    } catch {
      // Storage can be blocked. Then the system setting decides.
    }

    const dark = resolveDarkTheme(
      stored,
      window.matchMedia("(prefers-color-scheme: dark)").matches,
    );

    document.documentElement.classList.toggle("dark", dark);
  }, []);

  return (
    <html lang="en" style={FONT_VARIABLES} suppressHydrationWarning>
      <body className="min-h-svh bg-background text-foreground antialiased">
        <title>VentureScope could not start</title>

        <main className="surface-glow flex min-h-svh items-center justify-center p-6">
          <div className="w-full max-w-xl rounded-2xl border bg-card p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-destructive">
              Something went wrong
            </p>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight">{copy.title}</h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">{copy.description}</p>

            {reference === null ? null : (
              <div className="mt-5 space-y-2 rounded-xl border bg-muted/40 p-4">
                <div className="text-xs font-medium text-muted-foreground">Reference</div>

                <code className="inline-block select-all rounded-lg bg-background px-3 py-1.5 font-mono text-sm tracking-wide ring-1 ring-border">
                  {reference}
                </code>

                <p className="text-xs leading-5 text-muted-foreground">{ERROR_REFERENCE_HINT}</p>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => retry()}
                className="touch-target h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90"
              >
                Try again
              </button>

              <a
                href={copy.homeHref}
                className="touch-link inline-flex h-10 items-center rounded-lg border border-border bg-background px-4 text-sm font-medium hover:bg-muted"
              >
                {copy.homeLabel}
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
