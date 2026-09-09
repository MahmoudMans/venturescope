import {
  describe,
  expect,
  it,
} from "vitest";

import {
  parseAlertFingerprint,
  parseAlertKey,
  parseAlertReceiptOperation,
} from "@/lib/notifications/validation";


describe(
  "alert inbox validation",
  () => {
    it(
      "validates receipt operations",
      () => {
        expect(
          parseAlertReceiptOperation(
            "SNOOZE_24H",
          ),
        ).toBe(
          "SNOOZE_24H",
        );


        expect(
          () =>
            parseAlertReceiptOperation(
              "DELETE_PROJECT",
            ),
        ).toThrow(
          /operation/i,
        );
      },
    );


    it(
      "validates alert keys",
      () => {
        expect(
          parseAlertKey(
            "ACTION:abc-123",
          ),
        ).toBe(
          "ACTION:abc-123",
        );
      },
    );


    it(
      "validates alert fingerprints",
      () => {
        expect(
          parseAlertFingerprint(
            "0123456789abcdef",
          ),
        ).toBe(
          "0123456789abcdef",
        );


        expect(
          () =>
            parseAlertFingerprint(
              "bad",
            ),
        ).toThrow(
          /fingerprint/i,
        );
      },
    );
  },
);
