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
  "DecisionAction schema",
  () => {
    it(
      "persists the management-action lifecycle",
      () => {
        expect(
          schema,
        ).toContain(
          "model DecisionAction",
        );


        expect(
          schema,
        ).toMatch(
          /priority\s+String/,
        );


        expect(
          schema,
        ).toMatch(
          /status\s+String/,
        );
      },
    );


    it(
      "supports ownership and due dates",
      () => {
        expect(
          schema,
        ).toMatch(
          /ownerName\s+String\?/,
        );


        expect(
          schema,
        ).toMatch(
          /dueDate\s+DateTime\?/,
        );
      },
    );


    it(
      "cascades project deletion without deleting creator accounts",
      () => {
        expect(
          schema,
        ).toContain(
          "onDelete: Cascade",
        );


        expect(
          schema,
        ).toContain(
          'onDelete: SetNull',
        );
      },
    );
  },
);
