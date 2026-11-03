"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  ACCOUNT_NAV_LINKS,
  WORKSPACE_NAV_LINKS,
  isAppNavLinkActive,
  type AppNavLink,
} from "@/lib/app/navigation";
import { cn } from "@/lib/utils";

function NavGroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </div>
  );
}

function NavLinkItem({ link, pathname }: { link: AppNavLink; pathname: string }) {
  const active = isAppNavLinkActive(pathname, link.href);

  const Icon = link.icon;

  return (
    <Link
      href={link.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "touch-target group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "text-foreground/80 hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0",
          active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
        )}
        aria-hidden="true"
      />

      {link.label}
    </Link>
  );
}

export function AppSidebarNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="flex-1 space-y-7 overflow-y-auto px-3 py-5">
      <div>
        <NavGroupLabel>Workspace</NavGroupLabel>

        <div className="space-y-1">
          {WORKSPACE_NAV_LINKS.map((link) => (
            <NavLinkItem key={link.href} link={link} pathname={pathname} />
          ))}
        </div>
      </div>

      <div>
        <NavGroupLabel>Account</NavGroupLabel>

        <div className="space-y-1">
          {ACCOUNT_NAV_LINKS.map((link) => (
            <NavLinkItem key={link.href} link={link} pathname={pathname} />
          ))}
        </div>
      </div>
    </nav>
  );
}
