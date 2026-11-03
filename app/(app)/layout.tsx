import { LifeBuoy, Lock } from "lucide-react";
import Link from "next/link";

import { AppSidebarNav } from "@/components/app/app-sidebar-nav";
import { CommandPalette, type CommandPaletteItem } from "@/components/app/command-palette";
import { LogoutButton } from "@/components/app/logout-button";
import { MobileNav } from "@/components/app/mobile-nav";
import { VentureScopeLogo } from "@/components/brand/venturescope-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { loadDisplayName } from "@/lib/account/load-display-name";
import {
  ACCOUNT_NAV_LINKS,
  WORKSPACE_NAV_LINKS,
  modelInitials,
  modelOverviewHref,
} from "@/lib/app/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { loadSharedModels } from "@/lib/dashboard/load-shared-models";
import { sharedModelHint } from "@/lib/dashboard/shared-models";
import { prisma } from "@/lib/db/prisma";
import { PUBLIC_INFO_LINKS } from "@/lib/site/public-pages";

export default async function ApplicationLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  const models = await prisma.project.findMany({
    where: {
      userId: user.id,
    },

    orderBy: {
      updatedAt: "desc",
    },

    select: {
      id: true,
      name: true,
      industry: true,
    },

    take: 50,
  });

  const sharedModels = await loadSharedModels(user.id);

  const paletteItems: CommandPaletteItem[] = [
    ...[...WORKSPACE_NAV_LINKS, ...ACCOUNT_NAV_LINKS].map((link) => ({
      id: `page:${link.href}`,
      label: link.label,
      hint: link.description,
      href: link.href,
      kind: "page" as const,
    })),

    ...models.map((model) => ({
      id: `model:${model.id}`,
      label: model.name,
      hint: model.industry?.trim()
        ? `${model.industry.trim()} · Open overview`
        : "Open model overview",
      href: modelOverviewHref(model.id),
      kind: "model" as const,
    })),

    ...sharedModels.map((model) => ({
      id: `shared:${model.id}`,
      label: model.name,
      hint: sharedModelHint(model),
      href: modelOverviewHref(model.id),
      kind: "model" as const,
    })),

    ...PUBLIC_INFO_LINKS.map((link) => ({
      id: `info:${link.href}`,
      label: link.label,
      hint: link.description,
      href: link.href,
      kind: "page" as const,
    })),
  ];

  // The session keeps the name from sign-in time, so read the saved one from the database.
  const displayName = (await loadDisplayName(user.id, user.name)) || "VentureScope user";

  return (
    <div className="min-h-svh bg-muted/30 print:bg-white">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-sidebar lg:flex lg:flex-col print:hidden">
        <div className="flex h-16 items-center border-b px-5">
          <VentureScopeLogo />
        </div>

        <AppSidebarNav />

        <div className="border-t p-4">
          <Link
            href="/account/profile"
            className="flex items-center gap-3 rounded-xl bg-muted/60 p-3 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <div
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-xs font-semibold text-white"
            >
              {modelInitials(displayName)}
            </div>

            <div className="min-w-0">
              <div className="break-words text-sm font-medium">{displayName}</div>

              <div className="break-all text-xs text-muted-foreground">{user.email}</div>
            </div>
          </Link>

          <div className="mt-3 flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
            <Lock className="size-3" aria-hidden="true" />
            Private workspace
          </div>
        </div>
      </aside>

      <div className="lg:pl-64 print:pl-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-2 border-b bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 lg:px-8 print:hidden">
          <div className="flex items-center gap-2">
            <MobileNav />

            <div className="lg:hidden">
              <VentureScopeLogo compact />
            </div>

            <CommandPalette items={paletteItems} />
          </div>

          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="icon">
              <Link
                href="/help"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Help center (opens in a new tab)"
              >
                <LifeBuoy className="size-4" aria-hidden="true" />
              </Link>
            </Button>

            <ThemeToggle />

            <LogoutButton />
          </div>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}
