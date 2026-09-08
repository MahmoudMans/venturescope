import {
  expect,
  test,
} from "@playwright/test";

test.describe(
  "production security and operations",
  () => {
    test(
      "public responses carry hardened browser headers",
      async ({
        page,
      }) => {
        const response =
          await page.goto(
            "/demo",
          );

        expect(
          response,
        ).not.toBeNull();

        const headers =
          response!.headers();

        expect(
          headers[
            "x-content-type-options"
          ],
        ).toBe(
          "nosniff",
        );

        expect(
          headers[
            "x-frame-options"
          ],
        ).toBe(
          "DENY",
        );

        expect(
          headers[
            "referrer-policy"
          ],
        ).toBe(
          "strict-origin-when-cross-origin",
        );

        expect(
          headers[
            "permissions-policy"
          ],
        ).toContain(
          "camera=()",
        );

        expect(
          headers[
            "content-security-policy"
          ],
        ).toContain(
          "frame-ancestors 'none'",
        );

        expect(
          headers[
            "content-security-policy"
          ],
        ).not.toContain(
          "'unsafe-eval'",
        );

        expect(
          headers[
            "x-powered-by"
          ],
        ).toBeUndefined();

        expect(
          headers[
            "x-request-id"
          ],
        ).toBeTruthy();
      },
    );

    test(
      "health and readiness endpoints expose only operational state",
      async ({
        request,
      }) => {
        const health =
          await request.get(
            "/api/health",
          );

        expect(
          health.status(),
        ).toBe(
          200,
        );

        expect(
          await health.json(),
        ).toMatchObject({
          status:
            "ok",

          service:
            "venturescope",
        });

        const ready =
          await request.get(
            "/api/ready",
          );

        expect(
          ready.status(),
        ).toBe(
          200,
        );

        expect(
          await ready.json(),
        ).toMatchObject({
          status:
            "ready",

          database:
            "available",
        });
      },
    );

    test(
      "cross-origin state-changing requests are rejected",
      async ({
        request,
      }) => {
        const response =
          await request.post(
            "/register",
            {
              headers: {
                Origin:
                  "https://attacker.example",
              },
            },
          );

        expect(
          response.status(),
        ).toBe(
          403,
        );

        expect(
          await response.json(),
        ).toMatchObject({
          error:
            "Cross-origin state-changing request rejected.",
        });
      },
    );

    test(
      "private routes advertise noindex",
      async ({
        request,
      }) => {
        for (
          const path
          of [
            "/dashboard",
            "/projects/example/overview",
          ]
        ) {
          const response =
            await request.get(
              path,
              {
                // Inspect the protected route's own response.
                // Following the redirect would inspect /login instead.
                maxRedirects:
                  0,
              },
            );

          expect(
            [
              302,
              303,
              307,
              308,
            ],
          ).toContain(
            response.status(),
          );

          expect(
            response.headers()[
              "x-robots-tag"
            ],
          ).toContain(
            "noindex",
          );

          expect(
            response.headers()[
              "location"
            ],
          ).toMatch(
            /\/login/,
          );
        }
      },
    );
  },
);
