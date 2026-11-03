"use client";

import { ArrowLeft, ArrowRight, LayoutDashboard, SearchX, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  NOT_FOUND_SEARCH_TIP,
  NOT_FOUND_SUGGESTION_LABEL,
  notFoundActions,
  notFoundCopy,
  suggestPages,
  type NotFoundArea,
} from "@/lib/site/not-found-page";

/** The address never changes while this page is open, so there is nothing to subscribe to. */
function subscribeToNothing() {
  return () => undefined;
}

function isBrowser() {
  return true;
}

function isServer() {
  return false;
}

/**
 * The page that is shown when an address leads nowhere. Outside the app it also guesses what a
 * mistyped address meant. The guess is made only after the page is on screen, because the server
 * draws this page once for every address and cannot know which one was typed.
 */
export function NotFoundState({ area }: { area: NotFoundArea }) {
  const copy = notFoundCopy(area);

  const actions = notFoundActions(area);

  const ready = useSyncExternalStore(subscribeToNothing, isBrowser, isServer);

  const pathname = usePathname();

  const suggestions = area === "site" && ready ? suggestPages(pathname) : [];

  const PrimaryIcon = area === "app" ? LayoutDashboard : ArrowLeft;

  const SecondaryIcon = area === "app" ? Users : LayoutDashboard;

  const content = (
    <div className="flex flex-col items-center gap-4 text-center">
      <div
        aria-hidden="true"
        className="flex size-12 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-sm"
      >
        <SearchX className="size-5" />
      </div>

      <p className="text-sm font-semibold text-primary">404</p>

      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{copy.title}</h1>

      <p className="max-w-md text-sm leading-6 text-muted-foreground">{copy.description}</p>

      {suggestions.length === 0 ? null : (
        <nav
          aria-label="Pages you may have meant"
          data-testid="not-found-suggestions"
          className="w-full max-w-md space-y-3 rounded-xl border bg-muted/40 p-4"
        >
          <p className="text-sm font-medium">{NOT_FOUND_SUGGESTION_LABEL}</p>

          <ul className="flex flex-wrap justify-center gap-2">
            {suggestions.map((page) => (
              <li key={page.href}>
                <Button asChild variant="secondary" size="sm">
                  <Link href={page.href}>
                    {page.label}

                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="mt-2 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href={actions.primary.href}>
            <PrimaryIcon className="size-4" aria-hidden="true" />
            {actions.primary.label}
          </Link>
        </Button>

        <Button asChild variant="outline" size="lg">
          <Link href={actions.secondary.href}>
            <SecondaryIcon className="size-4" aria-hidden="true" />
            {actions.secondary.label}
          </Link>
        </Button>
      </div>

      {area === "app" ? (
        <p className="max-w-md text-xs leading-5 text-muted-foreground">{NOT_FOUND_SEARCH_TIP}</p>
      ) : (
        <p className="max-w-md text-xs leading-5 text-muted-foreground">
          Still stuck? Visit the{" "}
          <Link
            href="/help"
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
          >
            Help center
          </Link>
          .
        </p>
      )}
    </div>
  );

  if (area === "app") {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 py-12 lg:px-8 lg:py-20">
        <Card>
          <CardContent className="py-10">{content}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <section className="surface-glow flex min-h-[60svh] items-center justify-center px-5 py-16 sm:py-24">
      {content}
    </section>
  );
}
