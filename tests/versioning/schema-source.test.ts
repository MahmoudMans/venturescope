import {
  readFileSync,
} from "node:fs";

import {
  describe,
  expect,
  it,
} from "vitest";


const schema =
  readFileSync(
    "prisma/schema.prisma",
    "utf8",
  );


describe(
  "Project revision schema",
  () => {
    it(
      "has a dedicated integer revision sequence",
      () => {
        expect(
          schema,
        ).toMatch(
          /revisionSequence\s+Int\s+@default\(0\)/,
        );
      },
    );


    it(
      "keeps revision numbers unique per project",
      () => {
        expect(
          schema,
        ).toContain(
          "@@unique([projectId, version])",
        );
      },
    );


    it(
      "stores immutable JSON snapshots and restore ancestry",
      () => {
        expect(
          schema,
        ).toContain(
          "snapshot",
        );


        expect(
          schema,
        ).toContain(
          "sourceRevisionId",
        );
      },
    );
  },
);
