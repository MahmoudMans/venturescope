import {
  describe,
  expect,
  it,
} from "vitest";

import {
  sanitizeLogMetadata,
} from "@/lib/observability/logger";


describe(
  "structured observability logging",
  () => {
    it(
      "redacts secret and personal credential fields",
      () => {
        expect(
          sanitizeLogMetadata({
            requestId:
              "request-12345678",

            AUTH_SECRET:
              "private",

            password:
              "private",

            authorization:
              "Bearer private",

            DATABASE_URL:
              "postgresql://private",

            nested: {
              token:
                "private",

              status:
                "ok",
            },
          }),
        ).toEqual({
          requestId:
            "request-12345678",

          AUTH_SECRET:
            "[REDACTED]",

          password:
            "[REDACTED]",

          authorization:
            "[REDACTED]",

          DATABASE_URL:
            "[REDACTED]",

          nested: {
            token:
              "[REDACTED]",

            status:
              "ok",
          },
        });
      },
    );
  },
);
