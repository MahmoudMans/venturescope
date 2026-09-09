import {
  describe,
  expect,
  it,
} from "vitest";

import {
  deterministicAlertFingerprint,
} from "@/lib/notifications/fingerprint";


describe(
  "alert fingerprints",
  () => {
    it(
      "creates deterministic 16-character fingerprints",
      () => {
        const first =
          deterministicAlertFingerprint(
            "risk|critical|95",
          );


        const second =
          deterministicAlertFingerprint(
            "risk|critical|95",
          );


        expect(
          first,
        ).toBe(
          second,
        );


        expect(
          first,
        ).toMatch(
          /^[a-f0-9]{16}$/u,
        );
      },
    );


    it(
      "changes when underlying alert content changes",
      () => {
        expect(
          deterministicAlertFingerprint(
            "capital|500",
          ),
        ).not.toBe(
          deterministicAlertFingerprint(
            "capital|750",
          ),
        );
      },
    );
  },
);
