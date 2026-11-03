"use client";

import {
  ArrowLeft,
  Check,
  CircleAlert,
  Copy,
  LayoutDashboard,
  LifeBuoy,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ERROR_REFERENCE_HINT, errorPageCopy, errorReference } from "@/lib/site/error-page";

/**
 * The page that replaces a page which failed to load. It never shows the message of the error.
 * It shows a short reference instead, which is also written in the server log.
 *
 * `retry` asks Next.js to fetch and draw the page again, so a problem that went away is fixed
 * without a full reload.
 */
export function ErrorState({
  area,
  scope,
  error,
  retry,
}: {
  area: "app" | "site";

  /** A short word for the console, for example "page". */
  scope: string;

  error: unknown;

  retry: () => void;
}) {
  const copy = errorPageCopy(area);

  const reference = errorReference(error);

  const [copied, setCopied] = useState(false);

  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Only the reference is written to the console. The message of the error stays hidden.
    console.error(`VentureScope ${scope} error`, { digest: reference });
  }, [scope, reference]);

  useEffect(() => {
    // The old page is gone, so the focus moves to the new title for keyboard and screen reader users.
    titleRef.current?.focus({ preventScroll: true });
  }, []);

  async function copyReference(value: string) {
    try {
      await navigator.clipboard.writeText(value);

      setCopied(true);

      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  const HomeIcon = area === "app" ? LayoutDashboard : ArrowLeft;

  const card = (
    <Card className="w-full max-w-xl [--card-spacing:--spacing(6)]">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div
            aria-hidden="true"
            className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"
          >
            <CircleAlert className="size-6" />
          </div>

          <div className="min-w-0 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-destructive">
              Something went wrong
            </p>

            <h1
              ref={titleRef}
              tabIndex={-1}
              className="text-2xl font-semibold tracking-tight outline-none"
            >
              {copy.title}
            </h1>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <p className="text-sm leading-6 text-muted-foreground">{copy.description}</p>

        {reference === null ? null : (
          <div className="space-y-2 rounded-xl border bg-muted/40 p-4">
            <div className="text-xs font-medium text-muted-foreground">Reference</div>

            <div className="flex flex-wrap items-center gap-3">
              <code
                data-testid="error-reference"
                className="select-all rounded-lg bg-background px-3 py-1.5 font-mono text-sm tracking-wide ring-1 ring-border"
              >
                {reference}
              </code>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyReference(reference)}
              >
                {copied ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : (
                  <Copy className="size-4" aria-hidden="true" />
                )}

                {copied ? "Copied" : "Copy"}
              </Button>
            </div>

            <p className="text-xs leading-5 text-muted-foreground">{ERROR_REFERENCE_HINT}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" size="lg" onClick={() => retry()}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Try again
          </Button>

          <Button asChild variant="outline" size="lg">
            <Link href={copy.homeHref}>
              <HomeIcon className="size-4" aria-hidden="true" />
              {copy.homeLabel}
            </Link>
          </Button>

          <Button asChild variant="ghost" size="lg">
            <Link href="/help">
              <LifeBuoy className="size-4" aria-hidden="true" />
              Help
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (area === "app") {
    return <div className="mx-auto flex w-full max-w-2xl justify-center px-5 py-12">{card}</div>;
  }

  return (
    <main className="surface-glow flex min-h-svh items-center justify-center bg-background p-6">
      {card}
    </main>
  );
}
