import {
  describe,
  expect,
  it,
} from "vitest";

import {
  csvRecords,
  parseCsvMatrix,
} from "@/lib/data-import/csv";


describe(
  "dependency-free CSV parser",
  () => {
    it(
      "parses ordinary CSV",
      () => {
        expect(
          parseCsvMatrix(
            "a,b\n1,2",
          ),
        ).toEqual([
          [
            "a",
            "b",
          ],
          [
            "1",
            "2",
          ],
        ]);
      },
    );


    it(
      "parses quoted commas",
      () => {
        const result =
          csvRecords(
            'name,note\nAlice,"Hello, world"',
          );


        expect(
          result.records[
            0
          ].note,
        ).toBe(
          "Hello, world",
        );
      },
    );


    it(
      "parses escaped quotes",
      () => {
        const result =
          csvRecords(
            'name,note\nAlice,"He said ""hello"""',
          );


        expect(
          result.records[
            0
          ].note,
        ).toBe(
          'He said "hello"',
        );
      },
    );


    it(
      "rejects duplicate headers",
      () => {
        expect(
          () =>
            csvRecords(
              "a,a\n1,2",
            ),
        ).toThrow(
          /duplicate headers/i,
        );
      },
    );
  },
);
