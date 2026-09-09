import {
  existsSync,
  readFileSync,
} from "node:fs";

import {
  describe,
  expect,
  it,
} from "vitest";


const page =
  readFileSync(
    "app/(app)/projects/[projectId]/portfolio/page.tsx",
    "utf8",
  );


const component =
  readFileSync(
    "components/portfolio-dashboard/portfolio-dashboard-workspace.tsx",
    "utf8",
  );


const schema =
  readFileSync(
    "prisma/schema.prisma",
    "utf8",
  );


describe(
  "Portfolio Dashboard security",
  () => {
    it(
      "authorizes the current project before portfolio access",
      () => {
        expect(
          page,
        ).toContain(
          "getOwnedProject",
        );
      },
    );


    it(
      "uses authenticated workspace membership authority",
      () => {
        expect(
          page,
        ).toContain(
          "workspaceMember.findMany",
        );


        expect(
          page,
        ).toMatch(
          /userId:\s*user\.id/,
        );
      },
    );


    it(
      "limits portfolio projects to member workspace IDs",
      () => {
        expect(
          page,
        ).toContain(
          "workspaceIds",
        );


        expect(
          page,
        ).toMatch(
          /workspaceId:\s*\{\s*in:\s*workspaceIds/,
        );
      },
    );


    it(
      "caps each dashboard load to 24 projects",
      () => {
        expect(
          page,
        ).toMatch(
          /take:\s*24/,
        );
      },
    );


    it(
      "creates no Portfolio mutation Server Action",
      () => {
        expect(
          existsSync(
            "app/(app)/projects/[projectId]/portfolio/actions.ts",
          ),
        ).toBe(
          false,
        );
      },
    );


    it(
      "creates no Portfolio persistence model",
      () => {
        expect(
          schema,
        ).not.toContain(
          "model PortfolioDashboard",
        );


        expect(
          schema,
        ).not.toContain(
          "model PortfolioMetric",
        );
      },
    );


    it(
      "contains no mutation action import in client workspace",
      () => {
        expect(
          component,
        ).not.toContain(
          '/actions"',
        );
      },
    );
  },
);
