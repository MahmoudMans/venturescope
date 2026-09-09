import {
  describe,
  expect,
  it,
} from "vitest";

import {
  resolveProjectAlertInbox,
} from "@/lib/notifications/receipts";

import type {
  ProjectAlert,
  ProjectAlertReceiptView,
} from "@/lib/notifications/types";


function alert(
  fingerprint =
    "0123456789abcdef",
): ProjectAlert {
  return {
    key:
      "CAPITAL_NEED",

    fingerprint,

    category:
      "CAPITAL",

    severity:
      "WARNING",

    title:
      "Capital need",

    detail:
      "Funding required",

    sourceHref:
      "/capital",

    sourceLabel:
      "Capital",

    createdAt:
      null,
  };
}


function receipt({
  fingerprint =
    "0123456789abcdef",
  readAt =
    "2027-01-01T00:00:00.000Z",
  dismissedAt =
    null,
  snoozedUntil =
    null,
}: {
  fingerprint?:
    string;

  readAt?:
    string |
    null;

  dismissedAt?:
    string |
    null;

  snoozedUntil?:
    string |
    null;
} = {}): ProjectAlertReceiptView {
  return {
    id:
      "receipt-1",

    alertKey:
      "CAPITAL_NEED",

    fingerprint,

    readAt,

    dismissedAt,

    snoozedUntil,

    updatedAt:
      "2027-01-01T00:00:00.000Z",
  };
}


describe(
  "alert receipt resolution",
  () => {
    const now =
      new Date(
        "2027-01-02T00:00:00.000Z",
      );


    it(
      "marks matching receipt as read",
      () => {
        const inbox =
          resolveProjectAlertInbox({
            alerts: [
              alert(),
            ],

            receipts: [
              receipt(),
            ],

            now,
          });


        expect(
          inbox.visible[
            0
          ].read,
        ).toBe(
          true,
        );


        expect(
          inbox.summary
            .unread,
        ).toBe(
          0,
        );
      },
    );


    it(
      "reactivates changed alert fingerprints",
      () => {
        const inbox =
          resolveProjectAlertInbox({
            alerts: [
              alert(
                "aaaaaaaaaaaaaaaa",
              ),
            ],

            receipts: [
              receipt({
                fingerprint:
                  "bbbbbbbbbbbbbbbb",
              }),
            ],

            now,
          });


        expect(
          inbox.visible[
            0
          ].read,
        ).toBe(
          false,
        );


        expect(
          inbox.visible[
            0
          ].changedSinceReceipt,
        ).toBe(
          true,
        );
      },
    );


    it(
      "separates dismissed alerts",
      () => {
        const inbox =
          resolveProjectAlertInbox({
            alerts: [
              alert(),
            ],

            receipts: [
              receipt({
                dismissedAt:
                  "2027-01-01T12:00:00.000Z",
              }),
            ],

            now,
          });


        expect(
          inbox.visible,
        ).toHaveLength(
          0,
        );


        expect(
          inbox.dismissed,
        ).toHaveLength(
          1,
        );
      },
    );


    it(
      "separates active snoozes",
      () => {
        const inbox =
          resolveProjectAlertInbox({
            alerts: [
              alert(),
            ],

            receipts: [
              receipt({
                snoozedUntil:
                  "2027-01-03T00:00:00.000Z",
              }),
            ],

            now,
          });


        expect(
          inbox.visible,
        ).toHaveLength(
          0,
        );


        expect(
          inbox.snoozed,
        ).toHaveLength(
          1,
        );
      },
    );


    it(
      "returns expired snoozes to visible inbox",
      () => {
        const inbox =
          resolveProjectAlertInbox({
            alerts: [
              alert(),
            ],

            receipts: [
              receipt({
                snoozedUntil:
                  "2027-01-01T12:00:00.000Z",
              }),
            ],

            now,
          });


        expect(
          inbox.visible,
        ).toHaveLength(
          1,
        );


        expect(
          inbox.visible[
            0
          ].snoozed,
        ).toBe(
          false,
        );
      },
    );
  },
);
