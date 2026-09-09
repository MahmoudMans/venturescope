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
    "app/(app)/projects/[projectId]/imports/actions.ts",
    "utf8",
  );


const page =
  readFileSync(
    "app/(app)/projects/[projectId]/imports/page.tsx",
    "utf8",
  );


describe(
  "Data Import Center security",
  () => {
    it(
      "requires Editor authority before apply",
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
      "uses collaborative read authority for history",
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
      "scopes import history by project",
      () => {
        expect(
          page,
        ).toContain(
          "dataImportBatch.findMany",
        );


        expect(
          page,
        ).toMatch(
          /where:\s*\{\s*projectId/,
        );
      },
    );


    it(
      "bounds server-side CSV size",
      () => {
        expect(
          actions,
        ).toContain(
          "DATA_IMPORT_MAX_BYTES",
        );
      },
    );
  },
);
