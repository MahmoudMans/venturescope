import type {
  LucideIcon,
} from "lucide-react";
import {
  BadgeDollarSign,
  Banknote,
  BarChart3,
  CalendarRange,
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

export type ProjectWorkspaceNavigationItem = {
  label: string;

  href: string;

  icon: LucideIcon;
};

export type ProjectWorkspaceNavigationGroup = {
  label: string;

  items: ProjectWorkspaceNavigationItem[];
};

export function buildProjectWorkspaceNavigation(
  projectId: string,
): ProjectWorkspaceNavigationGroup[] {
  return [
    {
      label:
        "Workspace",

      items: [
        {
          label:
            "Overview",

          icon:
            LayoutDashboard,

          href:
            `/projects/${projectId}/overview`,
        },
      ],
    },

    {
      label:
        "Model",

      items: [
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

        {
          label:
            "Financing",

          icon:
            Banknote,

          href:
            `/projects/${projectId}/financing`,
        },

        {
          label:
            "Timeline",

          icon:
            CalendarRange,

          href:
            `/projects/${projectId}/timeline`,
        },
      ],
    },

    {
      label:
        "Analysis",

      items: [
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

        {
          label:
            "Scenarios",

          icon:
            Gauge,

          href:
            `/projects/${projectId}/scenarios`,
        },
      ],
    },

    {
      label:
        "Output",

      items: [
        {
          label:
            "Reports",

          icon:
            FileText,

          href:
            `/projects/${projectId}/reports`,
        },

        {
          label:
            "Settings",

          icon:
            Settings2,

          href:
            `/projects/${projectId}/settings`,
        },
      ],
    },
  ];
}
