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
  "ProjectAlertReceipt schema",
  () => {
    it(
      "persists per-user project alert state",
      () => {
        expect(
          schema,
        ).toContain(
          "model ProjectAlertReceipt",
        );


        expect(
          schema,
        ).toMatch(
          /projectId\s+String/,
        );


        expect(
          schema,
        ).toMatch(
          /userId\s+String/,
        );


        expect(
          schema,
        ).toMatch(
          /alertKey\s+String/,
        );


        expect(
          schema,
        ).toMatch(
          /fingerprint\s+String/,
        );
      },
    );


    it(
      "enforces one receipt per user project and alert key",
      () => {
        expect(
          schema,
        ).toContain(
          "@@unique([userId, projectId, alertKey])",
        );
      },
    );


    it(
      "persists read dismiss and snooze state",
      () => {
        expect(
          schema,
        ).toMatch(
          /readAt\s+DateTime\?/,
        );


        expect(
          schema,
        ).toMatch(
          /dismissedAt\s+DateTime\?/,
        );


        expect(
          schema,
        ).toMatch(
          /snoozedUntil\s+DateTime\?/,
        );
      },
    );


    it(
      "cascades personal state when user or project is removed",
      () => {
        expect(
          schema,
        ).toContain(
          'relation("ProjectAlertReceiptProject"',
        );


        expect(
          schema,
        ).toContain(
          'relation("ProjectAlertReceiptUser"',
        );


        const receiptModel =
          schema
            .split(
              "model ProjectAlertReceipt",
            )[
              1
            ]
            ?.split(
              "\n}",
            )[
              0
            ] ??
          "";


        expect(
          receiptModel.match(
            /onDelete:\s*Cascade/g,
          ) ??
          [],
        ).toHaveLength(
          2,
        );
      },
    );
  },
);
