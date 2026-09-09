import {
  readFileSync,
} from "node:fs";

import {
  describe,
  expect,
  it,
} from "vitest";


const files = {
  decisionCenter:
    readFileSync(
      "lib/finance/decision-center/service.ts",
      "utf8",
    ),

  boardRoom:
    readFileSync(
      "lib/finance/board-room/service.ts",
      "utf8",
    ),

  scorecard:
    readFileSync(
      "lib/finance/scorecard/service.ts",
      "utf8",
    ),

  variance:
    readFileSync(
      "lib/finance/variance-review/service.ts",
      "utf8",
    ),

  close:
    readFileSync(
      "lib/finance/period-close/service.ts",
      "utf8",
    ),
};


describe(
  "project audit instrumentation",
  () => {
    it(
      "audits Decision Center changes",
      () => {
        expect(
          files.decisionCenter.match(
            /projectAuditEvent\.create/g,
          ) ??
          [],
        ).toHaveLength(
          2,
        );
      },
    );


    it(
      "audits Executive Review freezes",
      () => {
        expect(
          files.boardRoom,
        ).toContain(
          "projectAuditEvent.create",
        );


        expect(
          files.boardRoom,
        ).toContain(
          "EXECUTIVE_REVIEW_FROZEN",
        );
      },
    );


    it(
      "audits KPI Target changes",
      () => {
        expect(
          files.scorecard.match(
            /projectAuditEvent\.create/g,
          ) ??
          [],
        ).toHaveLength(
          2,
        );
      },
    );


    it(
      "audits Variance Commentary changes",
      () => {
        expect(
          files.variance.match(
            /projectAuditEvent\.create/g,
          ) ??
          [],
        ).toHaveLength(
          2,
        );
      },
    );


    it(
      "audits Financial Close and Reopen",
      () => {
        expect(
          files.close.match(
            /projectAuditEvent\.create/g,
          ) ??
          [],
        ).toHaveLength(
          2,
        );


        expect(
          files.close,
        ).toContain(
          "FINANCIAL_PERIOD_REOPENED",
        );
      },
    );


    it(
      "writes audit events through domain transactions",
      () => {
        for (
          const source
          of Object.values(
            files,
          )
        ) {
          expect(
            source,
          ).toContain(
            "prisma.$transaction",
          );
        }
      },
    );
  },
);
