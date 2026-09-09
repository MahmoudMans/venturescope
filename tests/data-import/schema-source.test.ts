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
  "DataImportBatch schema",
  () => {
    it(
      "persists governed import identity",
      () => {
        expect(
          schema,
        ).toContain(
          "model DataImportBatch",
        );


        expect(
          schema,
        ).toMatch(
          /importType\s+String/,
        );


        expect(
          schema,
        ).toMatch(
          /fileName\s+String/,
        );


        expect(
          schema,
        ).toMatch(
          /status\s+String/,
        );
      },
    );


    it(
      "persists import result counts",
      () => {
        expect(
          schema,
        ).toMatch(
          /rowCount\s+Int/,
        );


        expect(
          schema,
        ).toMatch(
          /insertedCount\s+Int/,
        );


        expect(
          schema,
        ).toMatch(
          /updatedCount\s+Int/,
        );


        expect(
          schema,
        ).toMatch(
          /rejectedCount\s+Int/,
        );
      },
    );


    it(
      "persists error and actor metadata",
      () => {
        expect(
          schema,
        ).toMatch(
          /errorSummary\s+Json\?/,
        );


        expect(
          schema,
        ).toContain(
          "DataImportBatchCreator",
        );
      },
    );
  },
);
