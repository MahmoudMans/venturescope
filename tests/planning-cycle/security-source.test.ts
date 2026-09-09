import {
  readFileSync,
} from "node:fs";

import {
  describe,
  expect,
  it,
} from "vitest";


const actions =
  readFileSync(
    "app/(app)/projects/[projectId]/planning-cycle/actions.ts",
    "utf8",
  );


const service =
  readFileSync(
    "lib/finance/planning-cycle/service.ts",
    "utf8",
  );


const page =
  readFileSync(
    "app/(app)/projects/[projectId]/planning-cycle/page.tsx",
    "utf8",
  );


const component =
  readFileSync(
    "components/planning-cycle/planning-cycle-workspace.tsx",
    "utf8",
  );


const versioning =
  readFileSync(
    "lib/projects/versioning/service.ts",
    "utf8",
  );


describe(
  "Planning Cycle security architecture",
  () => {
    it(
      "requires Editor permission to freeze a baseline",
      () => {
        expect(
          actions.match(
            /\brequireProjectEditor\s*\(/g,
          ) ??
          [],
        ).toHaveLength(
          1,
        );
      },
    );


    it(
      "never updates or upserts immutable baselines",
      () => {
        expect(
          service,
        ).not.toContain(
          "forecastBaseline.update",
        );


        expect(
          service,
        ).not.toContain(
          "forecastBaseline.upsert",
        );
      },
    );


    it(
      "permits project readers to inspect planning cycles",
      () => {
        expect(
          page,
        ).toContain(
          "getOwnedProject",
        );


        expect(
          page,
        ).toContain(
          "getProjectForEditor",
        );
      },
    );


    it(
      "uses existing forecast export as live planning authority",
      () => {
        expect(
          component,
        ).toContain(
          "/export/csv",
        );
      },
    );


    it(
      "does not add planning baselines to model-revision restore state",
      () => {
        expect(
          versioning,
        ).not.toContain(
          "forecastBaselines:",
        );
      },
    );
  },
);
