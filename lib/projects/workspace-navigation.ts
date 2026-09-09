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
            "Actuals",

          icon:
            BarChart3,

          href:
            `/projects/${projectId}/actuals`,
        },
        {
          label:
            "Forecast Accuracy",

          icon:
            BarChart3,

          href:
            `/projects/${projectId}/forecast-accuracy`,
        },
        {
          label:
            "Planning Cycle",

          icon:
            BarChart3,

          href:
            `/projects/${projectId}/planning-cycle`,
        },
        {
          label:
            "Risk Center",

          icon:
            BarChart3,

          href:
            `/projects/${projectId}/risk-center`,
        },
        {
          label:
            "Capital Planning",

          icon:
            BarChart3,

          href:
            `/projects/${projectId}/capital-planning`,
        },
        {
          label:
            "Decision Center",

          icon:
            BarChart3,

          href:
            `/projects/${projectId}/decision-center`,
        },
        {
          label:
            "Board Room",

          icon:
            BarChart3,

          href:
            `/projects/${projectId}/board-room`,
        },
        {
          label:
            "Model Diff",

          icon:
            BarChart3,

          href:
            `/projects/${projectId}/version-diff`,
        },
        {
          label:
            "Scenario Comparison",

          icon:
            BarChart3,

          href:
            `/projects/${projectId}/scenario-comparison`,
        },
        {
          label:
            "Sensitivity Lab",

          icon:
            BarChart3,

          href:
            `/projects/${projectId}/sensitivity-lab`,
        },
        {
          label:
            "Scorecard",

          icon:
            BarChart3,

          href:
            `/projects/${projectId}/scorecard`,
        },
        {
          label:
            "Variance Review",

          icon:
            BarChart3,

          href:
            `/projects/${projectId}/variance-review`,
        },
        {
          label:
            "Financial Close",

          icon:
            BarChart3,

          href:
            `/projects/${projectId}/period-close`,
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
            "Analytics",

          icon:
            FileText,

          href:
            `/projects/${projectId}/analytics`,
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
