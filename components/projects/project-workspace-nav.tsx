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
  Badge,
} from "@/components/ui/badge";

type ProjectWorkspaceNavProps = {
  projectId: string;
};

const futureModelItems = [
  {
    label: "Assumptions",
    icon: SlidersHorizontal,
  },
  {
    label: "Revenue",
    icon: TrendingUp,
  },
  {
    label: "Expenses",
    icon: WalletCards,
  },
  {
    label: "Financing",
    icon: Banknote,
  },
];

const futureAnalysisItems = [
  {
    label: "Forecast",
    icon: BarChart3,
  },
  {
    label: "P&L",
    icon: Calculator,
  },
  {
    label: "Cash Flow",
    icon: BadgeDollarSign,
  },
  {
    label: "Customers",
    icon: Users,
  },
  {
    label: "Scenarios",
    icon: Gauge,
  },
];

const futureOutputItems = [
  {
    label: "Reports",
    icon: FileText,
  },
  {
    label: "Settings",
    icon: Settings2,
  },
];

export function ProjectWorkspaceNav({
  projectId,
}: ProjectWorkspaceNavProps) {
  return (
    <nav className="space-y-6">
      <NavSection
        label="Workspace"
      >
        <Link
          href={`/projects/${projectId}/overview`}
          className="flex h-10 items-center gap-3 rounded-lg bg-foreground px-3 text-sm font-medium text-background"
        >
          <LayoutDashboard
            className="size-4"
            aria-hidden="true"
          />

          Overview
        </Link>
      </NavSection>

      <NavSection label="Model">
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
  children: React.ReactNode;
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

type FutureItemProps = {
  label: string;
  icon: React.ComponentType<{
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
