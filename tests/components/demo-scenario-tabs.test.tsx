import {
  render,
  screen,
} from "@testing-library/react";
import {
  describe,
  expect,
  it,
} from "vitest";

import {
  DemoScenarioTabs,
} from "@/components/demo/demo-scenario-tabs";
import {
  ORBIT_ANALYTICS_SCENARIOS,
} from "@/lib/demo/orbit-analytics";

describe(
  "DemoScenarioTabs",
  () => {
    it(
      "renders public links for all demo scenarios",
      () => {
        render(
          <DemoScenarioTabs
            scenarios={
              ORBIT_ANALYTICS_SCENARIOS
            }
            activeScenarioId="demo-base"
          />,
        );

        expect(
          screen.getByRole(
            "link",
            {
              name:
                "Base Case",
            },
          ),
        ).toHaveAttribute(
          "href",
          "/demo?scenario=demo-base",
        );

        expect(
          screen.getByRole(
            "link",
            {
              name:
                "Bull Case",
            },
          ),
        ).toHaveAttribute(
          "href",
          "/demo?scenario=demo-bull",
        );

        expect(
          screen.getByRole(
            "link",
            {
              name:
                "Bear Case",
            },
          ),
        ).toHaveAttribute(
          "href",
          "/demo?scenario=demo-bear",
        );
      },
    );
  },
);
