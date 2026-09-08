import {
  describe,
  expect,
  it,
} from "vitest";

import {
  parseServerEnvironment,
} from "@/lib/env/server";

describe(
  "server environment validation",
  () => {
    it(
      "accepts a valid production environment",
      () => {
        const result =
          parseServerEnvironment({
            NODE_ENV:
              "production",

            DATABASE_URL:
              "postgresql://user:password@database:5432/venturescope?schema=public",

            AUTH_SECRET:
              "12345678901234567890123456789012",

            AUTH_URL:
              "https://venturescope.example.com",

            TRUST_PROXY_HEADERS:
              "true",

            APP_VERSION:
              "1.0.0",
          });

        expect(
          result.NODE_ENV,
        ).toBe(
          "production",
        );

        expect(
          result.TRUST_PROXY_HEADERS,
        ).toBe(
          "true",
        );
      },
    );

    it(
      "rejects missing database configuration",
      () => {
        expect(
          () =>
            parseServerEnvironment({
              NODE_ENV:
                "production",

              AUTH_SECRET:
                "12345678901234567890123456789012",
            }),
        ).toThrow(
          /DATABASE_URL/,
        );
      },
    );

    it(
      "rejects a short authentication secret",
      () => {
        expect(
          () =>
            parseServerEnvironment({
              NODE_ENV:
                "production",

              DATABASE_URL:
                "postgresql://user:password@database:5432/venturescope",

              AUTH_SECRET:
                "too-short",
            }),
        ).toThrow(
          /AUTH_SECRET/,
        );
      },
    );

    it(
      "rejects a non-PostgreSQL database URL",
      () => {
        expect(
          () =>
            parseServerEnvironment({
              NODE_ENV:
                "production",

              DATABASE_URL:
                "mysql://user:password@database/db",

              AUTH_SECRET:
                "12345678901234567890123456789012",
            }),
        ).toThrow(
          /PostgreSQL/,
        );
      },
    );
  },
);
