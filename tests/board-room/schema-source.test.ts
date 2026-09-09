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
  "ExecutiveReview schema",
  () => {
    it(
      "persists immutable JSON snapshots",
      () => {
        expect(
          schema,
        ).toContain(
          "model ExecutiveReview",
        );


        expect(
          schema,
        ).toMatch(
          /snapshot\s+Json/,
        );
      },
    );


    it(
      "retains review period and model version",
      () => {
        expect(
          schema,
        ).toMatch(
          /periodKey\s+String/,
        );


        expect(
          schema,
        ).toMatch(
          /modelVersion\s+String/,
        );
      },
    );


    it(
      "retains commentary and creator attribution",
      () => {
        expect(
          schema,
        ).toMatch(
          /commentary\s+String\?/,
        );


        expect(
          schema,
        ).toContain(
          'ExecutiveReviewCreator',
        );
      },
    );
  },
);
