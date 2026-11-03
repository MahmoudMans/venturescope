"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ACCOUNT_NAV_LINKS,
  WORKSPACE_NAV_LINKS,
  isAppNavLinkActive,
  type AppNavLink,
} from "@/lib/app/navigation";
import { cn } from "@/lib/utils";

function MobileNavItem({ link, pathname }: { link: AppNavLink; pathname: string }) {
  const active = isAppNavLinkActive(pathname, link.href);

  const Icon = link.icon;

  return (
    <DropdownMenuItem asChild>
      <Link
        href={link.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-10 cursor-pointer items-center gap-3 px-3 text-sm font-medium",
          active && "bg-accent text-accent-foreground",
        )}
      >
        <Icon
          className={cn("size-4", active ? "text-primary" : "text-muted-foreground")}
          aria-hidden="true"
        />

        {link.label}
      </Link>
    </DropdownMenuItem>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Workspace
        </DropdownMenuLabel>

        {WORKSPACE_NAV_LINKS.map((link) => (
          <MobileNavItem key={link.href} link={link} pathname={pathname} />
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Account
        </DropdownMenuLabel>

        {ACCOUNT_NAV_LINKS.map((link) => (
          <MobileNavItem key={link.href} link={link} pathname={pathname} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
