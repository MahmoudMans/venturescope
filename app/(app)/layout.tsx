import {
  BarChart3,
  BriefcaseBusiness,
  LayoutDashboard,
  LockKeyhole,
} from "lucide-react";
import Link from "next/link";

import { LogoutButton } from "@/components/app/logout-button";
import { VentureScopeLogo } from "@/components/brand/venturescope-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth/require-user";

export default async function ApplicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-svh bg-muted/20">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-background lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b px-5">
          <VentureScopeLogo />
        </div>

        <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-5">
          <div>
            <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Workspace
            </div>

            <Link
              href="/dashboard"
              className="flex h-10 items-center gap-3 rounded-lg bg-muted px-3 text-sm font-medium"
            >
              <LayoutDashboard
                className="size-4"
                aria-hidden="true"
              />

              Dashboard
            </Link>

            <div className="mt-1 flex h-10 cursor-not-allowed items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground">
              <BriefcaseBusiness
                className="size-4"
                aria-hidden="true"
              />

              Financial models

              <Badge
                variant="outline"
                className="ml-auto text-[9px]"
              >
                NEXT
              </Badge>
            </div>
          </div>

          <div>
            <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Analysis
            </div>

            <div className="flex h-10 cursor-not-allowed items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground">
              <BarChart3
                className="size-4"
                aria-hidden="true"
              />

              Financial analysis
            </div>
          </div>
        </nav>

        <div className="border-t p-4">
          <div className="rounded-xl bg-muted/60 p-3">
            <div className="truncate text-sm font-medium">
              {user.name ?? "VentureScope user"}
            </div>

            <div className="mt-1 truncate text-xs text-muted-foreground">
              {user.email}
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/95 px-5 backdrop-blur lg:px-8">
          <div className="lg:hidden">
            <VentureScopeLogo compact />
          </div>

          <div className="hidden lg:block">
            <div className="text-sm font-medium">
              Financial planning workspace
            </div>

            <div className="text-xs text-muted-foreground">
              Build assumptions. Model outcomes. Make decisions.
            </div>
          </div>

          <div className="flex items-center gap-1">
            <div className="hidden items-center gap-2 rounded-lg border px-3 py-1.5 text-xs text-muted-foreground md:flex">
              <LockKeyhole
                className="size-3.5"
                aria-hidden="true"
              />

              Private workspace
            </div>

            <ThemeToggle />

            <LogoutButton />
          </div>
        </header>

        <main>
          {children}
        </main>
      </div>
    </div>
  );
}
