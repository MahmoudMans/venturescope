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


const service =
  readFileSync(
    "lib/projects/versioning/service.ts",
    "utf8",
  );


describe(
  "modelVersion and revisionSequence separation",
  () => {
    it(
      "retains the existing modelVersion field",
      () => {
        expect(
          schema,
        ).toMatch(
          /^\s*modelVersion\s+/m,
        );
      },
    );


    it(
      "uses revisionSequence as immutable history counter",
      () => {
        expect(
          service,
        ).toContain(
          "revisionSequence: {",
        );


        expect(
          service,
        ).toContain(
          "increment:",
        );
      },
    );


    it(
      "does not increment modelVersion during checkpoint operations",
      () => {
        expect(
          service,
        ).not.toContain(
          "modelVersion: {",
        );
      },
    );
  },
);
