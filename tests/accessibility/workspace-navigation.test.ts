import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildProjectWorkspaceNavigation,
} from "@/lib/projects/workspace-navigation";

describe(
  "project workspace navigation",
  () => {
    it(
      "exposes all product surfaces exactly once",
      () => {
        const groups =
          buildProjectWorkspaceNavigation(
            "project-123",
          );

        const items =
          groups.flatMap(
            (
              group,
            ) =>
              group.items,
          );

        expect(
          items.map(
            (
              item,
            ) =>
              item.label,
          ),
        ).toEqual([
          "Overview",
          "Assumptions",
          "Revenue",
          "Expenses",
          "Financing",
          "Timeline",
          "Forecast",
          "Actuals",
          "Forecast Accuracy",
          "Planning Cycle",
          "Risk Center",
          "Capital Planning",
          "Decision Center",
          "P&L",
          "Cash Flow",
          "Customers",
          "Scenarios",
          "Reports",
          "Analytics",
          "Settings",
        ]);

        expect(
          new Set(
            items.map(
              (
                item,
              ) =>
                item.href,
            ),
          ).size,
        ).toBe(
          items.length,
        );
      },
    );

    it(
      "keeps every private link project-scoped",
      () => {
        const items =
          buildProjectWorkspaceNavigation(
            "private-project",
          ).flatMap(
            (
              group,
            ) =>
              group.items,
          );

        for (
          const item
          of items
        ) {
          expect(
            item.href,
          ).toMatch(
            /^\/projects\/private-project\//,
          );
        }
      },
    );
  },
);
