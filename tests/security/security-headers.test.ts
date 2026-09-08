import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildContentSecurityPolicy,
  buildSecurityHeaders,
} from "@/lib/security/headers";

describe(
  "production security headers",
  () => {
    it(
      "prevents framing and object embedding",
      () => {
        const policy =
          buildContentSecurityPolicy(
            true,
          );

        expect(
          policy,
        ).toContain(
          "frame-ancestors 'none'",
        );

        expect(
          policy,
        ).toContain(
          "object-src 'none'",
        );

        expect(
          policy,
        ).toContain(
          "form-action 'self'",
        );
      },
    );

    it(
      "does not allow eval in production scripts",
      () => {
        const policy =
          buildContentSecurityPolicy(
            true,
          );

        expect(
          policy,
        ).not.toContain(
          "'unsafe-eval'",
        );
      },
    );

    it(
      "allows dev tooling only outside production",
      () => {
        expect(
          buildContentSecurityPolicy(
            false,
          ),
        ).toContain(
          "'unsafe-eval'",
        );
      },
    );

    it(
      "includes HSTS only in production",
      () => {
        const production =
          buildSecurityHeaders(
            true,
          );

        const development =
          buildSecurityHeaders(
            false,
          );

        expect(
          production.some(
            (
              header,
            ) =>
              header.key ===
              "Strict-Transport-Security",
          ),
        ).toBe(
          true,
        );

        expect(
          development.some(
            (
              header,
            ) =>
              header.key ===
              "Strict-Transport-Security",
          ),
        ).toBe(
          false,
        );
      },
    );

    it(
      "disables browser features VentureScope does not need",
      () => {
        const permissions =
          buildSecurityHeaders(
            true,
          ).find(
            (
              header,
            ) =>
              header.key ===
              "Permissions-Policy",
          );

        expect(
          permissions
            ?.value,
        ).toContain(
          "camera=()",
        );

        expect(
          permissions
            ?.value,
        ).toContain(
          "microphone=()",
        );

        expect(
          permissions
            ?.value,
        ).toContain(
          "geolocation=()",
        );
      },
    );
  },
);
