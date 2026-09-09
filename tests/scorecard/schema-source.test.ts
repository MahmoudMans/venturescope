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
  "ProjectKpiTarget schema",
  () => {
    it(
      "persists target metric, period and value",
      () => {
        expect(
          schema,
        ).toContain(
          "model ProjectKpiTarget",
        );


        expect(
          schema,
        ).toMatch(
          /periodKey\s+String/,
        );


        expect(
          schema,
        ).toMatch(
          /metricCode\s+String/,
        );


        expect(
          schema,
        ).toMatch(
          /targetValue\s+Decimal/,
        );
      },
    );


    it(
      "enforces one target per project period and metric",
      () => {
        expect(
          schema,
        ).toContain(
          "@@unique([projectId, periodKey, metricCode])",
        );
      },
    );


    it(
      "retains management owner and creator attribution",
      () => {
        expect(
          schema,
        ).toMatch(
          /ownerName\s+String\?/,
        );


        expect(
          schema,
        ).toContain(
          "ProjectKpiTargetCreator",
        );
      },
    );
  },
);
