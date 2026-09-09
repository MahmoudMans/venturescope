import {
  readFileSync,
} from "node:fs";

import {
  describe,
  expect,
  it,
} from "vitest";


const component =
  readFileSync(
    "components/board-pack/board-pack-workspace.tsx",
    "utf8",
  );


describe(
  "Board Pack print readiness",
  () => {
    it(
      "uses native browser print",
      () => {
        expect(
          component,
        ).toContain(
          "window.print()",
        );


        expect(
          component,
        ).toContain(
          "Print / Save as PDF",
        );
      },
    );


    it(
      "contains print-specific A4 layout",
      () => {
        expect(
          component,
        ).toContain(
          "@media print",
        );


        expect(
          component,
        ).toContain(
          "size: A4",
        );
      },
    );


    it(
      "hides interactive controls from printed board pack",
      () => {
        expect(
          component,
        ).toContain(
          "board-pack-print-hidden",
        );
      },
    );


    it(
      "creates print page-break boundaries",
      () => {
        expect(
          component,
        ).toContain(
          "board-pack-break-before",
        );


        expect(
          component,
        ).toContain(
          "break-before: page",
        );
      },
    );
  },
);
