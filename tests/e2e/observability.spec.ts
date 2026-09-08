import {
  expect,
  test,
} from "@playwright/test";


const diagnosticsToken =
  "venturescope-e2e-diagnostics-token-20260908-secure";


test.describe(
  "production observability and diagnostics",
  () => {
    test(
      "safe observability endpoint returns a correlation identifier",
      async ({
        request,
      }) => {
        const response =
          await request.get(
            "/api/observability",
          );


        expect(
          response.status(),
        ).toBe(
          200,
        );


        expect(
          response.headers()[
            "cache-control"
          ],
        ).toContain(
          "no-store",
        );


        expect(
          response.headers()[
            "server-timing"
          ],
        ).toContain(
          "app;dur=",
        );


        const requestId =
          response.headers()[
            "x-request-id"
          ];


        expect(
          requestId,
        ).toBeTruthy();


        const payload =
          await response.json();


        expect(
          payload,
        ).toMatchObject({
          status:
            "ok",

          service:
            "venturescope",

          requestId,

          correlation:
            requestId,
        });
      },
    );


    test(
      "safe inbound correlation identifiers are preserved",
      async ({
        request,
      }) => {
        const requestId =
          "playwright-correlation-12345678";


        const response =
          await request.get(
            "/api/observability",
            {
              headers: {
                "X-Request-Id":
                  requestId,
              },
            },
          );


        expect(
          response.status(),
        ).toBe(
          200,
        );


        expect(
          response.headers()[
            "x-request-id"
          ],
        ).toBe(
          requestId,
        );


        const payload =
          await response.json();


        expect(
          payload.requestId,
        ).toBe(
          requestId,
        );
      },
    );


    test(
      "deep diagnostics are hidden without authorization",
      async ({
        request,
      }) => {
        const response =
          await request.get(
            "/api/diagnostics",
          );


        expect(
          response.status(),
        ).toBe(
          404,
        );


        const payload =
          await response.json();


        expect(
          payload.status,
        ).toBe(
          "not_found",
        );


        expect(
          JSON.stringify(
            payload,
          ),
        ).not.toContain(
          "database",
        );
      },
    );


    test(
      "authorized diagnostics report safe runtime and database state",
      async ({
        request,
      }) => {
        const response =
          await request.get(
            "/api/diagnostics",
            {
              headers: {
                Authorization:
                  `Bearer ${diagnosticsToken}`,

                "X-Request-Id":
                  "diagnostics-e2e-request-12345678",
              },
            },
          );


        expect(
          response.status(),
        ).toBe(
          200,
        );


        expect(
          response.headers()[
            "x-request-id"
          ],
        ).toBe(
          "diagnostics-e2e-request-12345678",
        );


        const payload =
          await response.json();


        expect(
          payload.status,
        ).toBe(
          "ok",
        );


        expect(
          payload.diagnostics,
        ).toMatchObject({
          service:
            "venturescope",

          database: {
            status:
              "ready",
          },
        });


        expect(
          payload.diagnostics
            .runtime
            .uptimeSeconds,
        ).toBeGreaterThanOrEqual(
          0,
        );


        expect(
          payload.diagnostics
            .memoryMb
            .rss,
        ).toBeGreaterThan(
          0,
        );


        expect(
          payload.diagnostics
            .requests
            .totalRequests,
        ).toBeGreaterThanOrEqual(
          1,
        );


        const serialized =
          JSON.stringify(
            payload,
          );


        for (
          const forbidden
          of [
            "AUTH_SECRET",
            "DATABASE_URL",
            diagnosticsToken,
          ]
        ) {
          expect(
            serialized,
          ).not.toContain(
            forbidden,
          );
        }
      },
    );
  },
);
