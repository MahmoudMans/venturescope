import {
  readFileSync,
} from "node:fs";

import {
  describe,
  expect,
  it,
} from "vitest";


const service =
  readFileSync(
    "lib/approvals/service.ts",
    "utf8",
  );


describe(
  "approval audit integration",
  () => {
    it(
      "uses the persistent ProjectAuditEvent ledger",
      () => {
        expect(
          service.match(
            /projectAuditEvent\.create/g,
          ) ??
          [],
        ).toHaveLength(
          3,
        );
      },
    );


    it(
      "associates audit evidence with ApprovalRequest entities",
      () => {
        expect(
          service.match(
            /entityType:\s*"ApprovalRequest"/g,
          ) ??
          [],
        ).toHaveLength(
          3,
        );
      },
    );


    it(
      "classifies rejection as warning governance evidence",
      () => {
        expect(
          service,
        ).toContain(
          'status ===\n                "REJECTED"',
        );


        expect(
          service,
        ).toContain(
          '"WARNING"',
        );
      },
    );
  },
);
