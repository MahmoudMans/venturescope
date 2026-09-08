import {
  expect,
  test,
} from "@playwright/test";


test.describe(
  "production release operations",
  () => {
    test(
      "version endpoint exposes only safe release identity",
      async ({
        request,
      }) => {
        const response =
          await request.get(
            "/api/version",
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
            "x-robots-tag"
          ],
        ).toContain(
          "noindex",
        );


        const payload =
          await response.json();


        expect(
          payload,
        ).toMatchObject({
          service:
            "venturescope",
        });


        expect(
          typeof payload.version,
        ).toBe(
          "string",
        );


        expect(
          payload.version.length,
        ).toBeGreaterThan(
          0,
        );


        expect(
          typeof payload.environment,
        ).toBe(
          "string",
        );


        expect(
          payload,
        ).not.toHaveProperty(
          "DATABASE_URL",
        );


        expect(
          payload,
        ).not.toHaveProperty(
          "AUTH_SECRET",
        );
      },
    );


    test(
      "crawler policy excludes operational API surfaces",
      async ({
        request,
      }) => {
        const response =
          await request.get(
            "/robots.txt",
          );

        expect(
          response.status(),
        ).toBe(
          200,
        );


        const body =
          await response.text();


        expect(
          body,
        ).toContain(
          "Disallow: /api/",
        );
      },
    );
  },
);
