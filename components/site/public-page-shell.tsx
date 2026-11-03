import Link from "next/link";
import type { ReactNode } from "react";

import { VentureScopeLogo } from "@/components/brand/venturescope-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { PUBLIC_INFO_LINKS } from "@/lib/site/public-pages";
import { cn } from "@/lib/utils";

/** Help, Privacy and Terms. Used in the footer of every public page. */
export function PublicFooterLinks({ className }: { className?: string }) {
  return (
    <nav
      aria-label="Help and legal"
      className={cn("flex flex-wrap items-center gap-x-5 gap-y-2 print:hidden", className)}
    >
      {PUBLIC_INFO_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="touch-target inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

/** Header, content area and footer for the public Help, Privacy and Terms pages. */
export function PublicPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <VentureScopeLogo shortOnPhone />

          <nav aria-label="Main" className="hidden items-center gap-7 md:flex print:hidden">
            <Link
              href="/demo"
              className="touch-reach text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Live demo
            </Link>

            <Link
              href="/help"
              className="touch-reach text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Help center
            </Link>
          </nav>

          <div className="flex items-center gap-2 print:hidden">
            <ThemeToggle />

            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/login">Sign in</Link>
            </Button>

            <Button asChild>
              <Link href="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <footer className="border-t bg-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <VentureScopeLogo />

          <PublicFooterLinks />

          <p>Deterministic financial planning.</p>
        </div>
      </footer>
    </div>
  );
}
