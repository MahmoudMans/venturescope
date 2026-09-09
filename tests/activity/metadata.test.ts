import {
  describe,
  expect,
  it,
} from "vitest";

import {
  parseProjectAuditMetadata,
  summarizeProjectAuditMetadata,
} from "@/lib/audit/metadata";


describe(
  "audit metadata",
  () => {
    it(
      "accepts primitive JSON metadata",
      () => {
        expect(
          parseProjectAuditMetadata({
            status:
              "OPEN",

            sequence:
              2,

            warning:
              true,

            reason:
              null,
          }),
        ).toEqual({
          status:
            "OPEN",

          sequence:
            2,

          warning:
            true,

          reason:
            null,
        });
      },
    );


    it(
      "drops nested unsupported display values",
      () => {
        expect(
          parseProjectAuditMetadata({
            status:
              "OPEN",

            nested: {
              secret:
                "x",
            },
          }),
        ).toEqual({
          status:
            "OPEN",
        });
      },
    );


    it(
      "creates compact metadata summaries",
      () => {
        expect(
          summarizeProjectAuditMetadata({
            status:
              "OPEN",

            sequence:
              2,
          }),
        ).toContain(
          "status=OPEN",
        );
      },
    );
  },
);
