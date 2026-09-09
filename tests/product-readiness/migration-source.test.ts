import {
  existsSync,
  readdirSync,
} from "node:fs";

import {
  join,
} from "node:path";

import {
  describe,
  expect,
  it,
} from "vitest";


function migrationCount():
  number {
  const root =
    "prisma/migrations";


  return readdirSync(
    root,
    {
      withFileTypes:
        true,
    },
  ).filter(
    (
      entry,
    ) =>
      entry.isDirectory() &&
      existsSync(
        join(
          root,
          entry.name,
          "migration.sql",
        ),
      ),
  ).length;
}


describe(
  "final migration authority",
  () => {
    it(
      "locks the roadmap migration count at seventeen",
      () => {
        expect(
          migrationCount(),
        ).toBe(
          17,
        );
      },
    );
  },
);
