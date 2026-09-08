import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildReleaseVersionPayload,
  normalizeReleaseEnvironment,
  normalizeReleaseVersion,
  RELEASE_SERVICE,
} from "@/lib/operations/version";


describe(
  "release version authority",
  () => {
    it(
      "normalizes blank release versions",
      () => {
        expect(
          normalizeReleaseVersion(
            undefined,
          ),
        ).toBe(
          "development",
        );

        expect(
          normalizeReleaseVersion(
            "   ",
          ),
        ).toBe(
          "development",
        );
      },
    );


    it(
      "preserves explicit release versions",
      () => {
        expect(
          normalizeReleaseVersion(
            "2026.09.08",
          ),
        ).toBe(
          "2026.09.08",
        );
      },
    );


    it(
      "normalizes runtime environment",
      () => {
        expect(
          normalizeReleaseEnvironment(
            undefined,
          ),
        ).toBe(
          "development",
        );

        expect(
          normalizeReleaseEnvironment(
            "production",
          ),
        ).toBe(
          "production",
        );
      },
    );


    it(
      "builds a non-secret operational payload",
      () => {
        expect(
          buildReleaseVersionPayload({
            APP_VERSION:
              "release-17",

            NODE_ENV:
              "production",

            AUTH_SECRET:
              "must-never-be-exposed",

            DATABASE_URL:
              "postgresql://secret",
          }),
        ).toEqual({
          service:
            RELEASE_SERVICE,

          version:
            "release-17",

          environment:
            "production",
        });
      },
    );
  },
);
