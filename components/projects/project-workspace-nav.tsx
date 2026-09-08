"use client";

import {
  BadgeDollarSign,
  Banknote,
  BarChart3,
  Calculator,
  FileText,
  Gauge,
  LayoutDashboard,
  Settings2,
  SlidersHorizontal,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import {
  usePathname,
} from "next/navigation";

import {
  Badge,
} from "@/components/ui/badge";
import {
  cn,
} from "@/lib/utils";

type ProjectWorkspaceNavProps = {
  projectId: string;
};

export function ProjectWorkspaceNav({
  projectId,
}: ProjectWorkspaceNavProps) {
  const pathname =
    usePathname();

  const workspaceItems = [
    {
      label:
        "Overview",

      icon:
        LayoutDashboard,

      href:
        `/projects/${projectId}/overview`,
    },
  ];

  const modelItems = [
    {
      label:
        "Assumptions",

      icon:
        SlidersHorizontal,

      href:
        `/projects/${projectId}/assumptions`,
    },

    {
      label:
        "Revenue",

      icon:
        TrendingUp,

      href:
        `/projects/${projectId}/revenue`,
    },

    {
      label:
        "Expenses",

      icon:
        WalletCards,

      href:
        `/projects/${projectId}/expenses`,
    },
  ];

  const analysisItems = [
    {
      label:
        "Forecast",

      icon:
        BarChart3,

      href:
        `/projects/${projectId}/forecast`,
    },

    {
      label:
        "P&L",

      icon:
        Calculator,

      href:
        `/projects/${projectId}/pnl`,
    },

    {
      label:
        "Cash Flow",

      icon:
        BadgeDollarSign,

      href:
        `/projects/${projectId}/cash-flow`,
    },

    {
      label:
        "Customers",

      icon:
        Users,

      href:
        `/projects/${projectId}/customers`,
    },
  ];

  const futureModelItems = [
    {
      label:
        "Financing",

      icon:
        Banknote,
    },
  ];

  const futureAnalysisItems = [
    {
      label:
        "Scenarios",

      icon:
        Gauge,
    },
  ];

  const futureOutputItems = [
    {
      label:
        "Reports",

      icon:
        FileText,
    },

    {
      label:
        "Settings",

      icon:
        Settings2,
    },
  ];

  return (
    <nav className="space-y-6">
      <NavSection label="Workspace">
        {workspaceItems.map(
          (
            item,
          ) => (
            <ActiveItem
              key={
                item.href
              }
              item={
                item
              }
              active={
                pathname ===
                item.href
              }
            />
          ),
        )}
      </NavSection>

      <NavSection label="Model">
        {modelItems.map(
          (
            item,
          ) => (
            <ActiveItem
              key={
                item.href
              }
              item={
                item
              }
              active={
                pathname ===
                item.href
              }
            />
          ),
        )}

        {futureModelItems.map(
          (
            item,
          ) => (
            <FutureItem
              key={
                item.label
              }
              {...item}
            />
          ),
        )}
      </NavSection>

      <NavSection label="Analysis">
        {analysisItems.map(
          (
            item,
          ) => (
            <ActiveItem
              key={
                item.href
              }
              item={
                item
              }
              active={
                pathname ===
                item.href
              }
            />
          ),
        )}

        {futureAnalysisItems.map(
          (
            item,
          ) => (
            <FutureItem
              key={
                item.label
              }
              {...item}
            />
          ),
        )}
      </NavSection>

      <NavSection label="Output">
        {futureOutputItems.map(
          (
            item,
          ) => (
            <FutureItem
              key={
                item.label
              }
              {...item}
            />
          ),
        )}
      </NavSection>
    </nav>
  );
}

function NavSection({
  label,
  children,
}: {
  label: string;

  children:
    React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>

      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}

type ActiveItemProps = {
  item: {
    label: string;

    href: string;

    icon:
      React.ComponentType<{
        className?: string;
      }>;
  };

  active:
    boolean;
};

function ActiveItem({
  item,
  active,
}: ActiveItemProps) {
  const Icon =
    item.icon;

  return (
    <Link
      href={
        item.href
      }
      className={cn(
        "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
        active
          ? "bg-foreground text-background"
          : "hover:bg-muted",
      )}
    >
      <Icon
        className="size-4"
        aria-hidden="true"
      />

      {
        item.label
      }
    </Link>
  );
}

type FutureItemProps = {
  label: string;

  icon:
    React.ComponentType<{
      className?: string;
    }>;
};

function FutureItem({
  label,
  icon: Icon,
}: FutureItemProps) {
  return (
    <div className="flex h-10 cursor-not-allowed items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground">
      <Icon
        className="size-4"
        aria-hidden="true"
      />

      <span className="truncate">
        {label}
      </span>

      <Badge
        variant="outline"
        className="ml-auto px-1.5 text-[8px]"
      >
        LATER
      </Badge>
    </div>
  );
}
