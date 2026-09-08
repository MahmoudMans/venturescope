import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  checkRateLimit,
  resetRateLimitStoreForTests,
} from "@/lib/security/rate-limit";

describe(
  "process-local abuse rate limiter",
  () => {
    beforeEach(
      () => {
        resetRateLimitStoreForTests();
      },
    );

    it(
      "allows requests inside the configured limit",
      () => {
        const first =
          checkRateLimit({
            key:
              "client-a",

            limit:
              2,

            windowMs:
              1000,

            now:
              100,
          });

        const second =
          checkRateLimit({
            key:
              "client-a",

            limit:
              2,

            windowMs:
              1000,

            now:
              200,
          });

        expect(
          first.allowed,
        ).toBe(
          true,
        );

        expect(
          second.allowed,
        ).toBe(
          true,
        );

        expect(
          second.remaining,
        ).toBe(
          0,
        );
      },
    );

    it(
      "blocks requests after the limit",
      () => {
        checkRateLimit({
          key:
            "client-a",

          limit:
            1,

          windowMs:
            1000,

          now:
            100,
        });

        const blocked =
          checkRateLimit({
            key:
              "client-a",

            limit:
              1,

            windowMs:
              1000,

            now:
              200,
          });

        expect(
          blocked.allowed,
        ).toBe(
          false,
        );

        expect(
          blocked.retryAfterSeconds,
        ).toBeGreaterThan(
          0,
        );
      },
    );

    it(
      "opens a new bucket after expiration",
      () => {
        checkRateLimit({
          key:
            "client-a",

          limit:
            1,

          windowMs:
            1000,

          now:
            100,
        });

        const reset =
          checkRateLimit({
            key:
              "client-a",

            limit:
              1,

            windowMs:
              1000,

            now:
              1101,
          });

        expect(
          reset.allowed,
        ).toBe(
          true,
        );

        expect(
          reset.remaining,
        ).toBe(
          0,
        );
      },
    );

    it(
      "isolates independent rate-limit identities",
      () => {
        checkRateLimit({
          key:
            "client-a",

          limit:
            1,

          windowMs:
            1000,

          now:
            100,
        });

        const other =
          checkRateLimit({
            key:
              "client-b",

            limit:
              1,

            windowMs:
              1000,

            now:
              200,
          });

        expect(
          other.allowed,
        ).toBe(
          true,
        );
      },
    );
  },
);
