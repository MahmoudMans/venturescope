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
  "ForecastBaseline schema",
  () => {
    it(
      "stores immutable forecast JSON",
      () => {
        expect(
          schema,
        ).toContain(
          "model ForecastBaseline",
        );


        expect(
          schema,
        ).toMatch(
          /snapshot\s+Json/,
        );
      },
    );


    it(
      "makes baseline names unique within a project",
      () => {
        expect(
          schema,
        ).toContain(
          "@@unique([projectId, name])",
        );
      },
    );


    it(
      "retains source model version",
      () => {
        expect(
          schema,
        ).toMatch(
          /modelVersion\s+String/,
        );
      },
    );
  },
);
