import {
  describe,
  expect,
  it,
} from "vitest";

import {
  isAuthVersionValid,
} from "@/lib/auth/session-security";


describe(
  "JWT session versioning",
  () => {
    it(
      "accepts the current auth version",
      () => {
        expect(
          isAuthVersionValid(
            4,
            4,
          ),
        ).toBe(
          true,
        );
      },
    );


    it(
      "rejects stale sessions",
      () => {
        expect(
          isAuthVersionValid(
            3,
            4,
          ),
        ).toBe(
          false,
        );
      },
    );


    it(
      "rejects missing or malformed versions",
      () => {
        expect(
          isAuthVersionValid(
            undefined,
            1,
          ),
        ).toBe(
          false,
        );

        expect(
          isAuthVersionValid(
            "1",
            1,
          ),
        ).toBe(
          false,
        );
      },
    );
  },
);
