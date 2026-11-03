import {
  LayoutDashboard,
  Plus,
  ShieldCheck,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AppNavLink = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const WORKSPACE_NAV_LINKS: AppNavLink[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Your financial models and portfolio health",
    icon: LayoutDashboard,
  },
  {
    href: "/workspaces",
    label: "Workspaces",
    description: "Teams, members and shared models",
    icon: Users,
  },
  {
    href: "/projects/new",
    label: "Create model",
    description: "Start a new financial model",
    icon: Plus,
  },
];

export const ACCOUNT_NAV_LINKS: AppNavLink[] = [
  {
    href: "/account/profile",
    label: "Profile",
    description: "Your display name and account details",
    icon: UserRound,
  },

  {
    href: "/account/security",
    label: "Security",
    description: "Password, sessions and account deletion",
    icon: ShieldCheck,
  },
];

export function isAppNavLinkActive(pathname: string, href: string): boolean {
  if (pathname === href) {
    return true;
  }

  if (href === "/dashboard") {
    return false;
  }

  return pathname.startsWith(`${href}/`);
}

export type AppModelLink = {
  id: string;
  name: string;
};

export function modelOverviewHref(projectId: string): string {
  return `/projects/${projectId}/overview`;
}

export function modelInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "M";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return (words[0][0] + words[1][0]).toUpperCase();
}
