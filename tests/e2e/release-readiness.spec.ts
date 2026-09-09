import {
  expect,
  test,
} from "@playwright/test";


test.describe(
  "Release Readiness security",
  () => {
    test(
      "anonymous users cannot access Release Readiness",
      async ({
        request,
      }) => {
        const response =
          await request.get(
            "/projects/not-a-real-project/release-readiness",
            {
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
            "location"
          ],
        ).toMatch(
          /\/login/,
        );
      },
    );
  },
);
