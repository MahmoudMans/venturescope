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
    "app/(app)/projects/[projectId]/versions/actions.ts",
    "utf8",
  );


const service =
  readFileSync(
    "lib/projects/versioning/service.ts",
    "utf8",
  );


describe(
  "model versioning security",
  () => {
    it(
      "requires Editor permission for checkpoint creation and restore",
      () => {
        /*
         * Count invocations only.
         *
         * A plain /requireProjectEditor/g also counts the imported
         * identifier, which is not an authorization check.
         */
        const calls =
          actions.match(
            /\brequireProjectEditor\s*\(/g,
          ) ??
          [];


        expect(
          calls,
        ).toHaveLength(
          2,
        );
      },
    );


    it(
      "never mutates an existing revision",
      () => {
        expect(
          service,
        ).not.toContain(
          "projectRevision.update",
        );


        expect(
          service,
        ).not.toContain(
          "projectRevision.upsert",
        );
      },
    );


    it(
      "restores transactionally and appends a new revision",
      () => {
        expect(
          service,
        ).toContain(
          "prisma.$transaction",
        );


        expect(
          service,
        ).toContain(
          "sourceRevisionId:",
        );


        expect(
          service,
        ).toContain(
          "projectRevision.create",
        );
      },
    );


    it(
      "uses revisionSequence instead of the existing modelVersion",
      () => {
        expect(
          service,
        ).toContain(
          "revisionSequence",
        );


        expect(
          service,
        ).not.toContain(
          "modelVersion: {",
        );
      },
    );
  },
);
