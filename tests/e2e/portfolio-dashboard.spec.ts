import {
  expect,
  test,
} from "@playwright/test";


test.describe(
  "Portfolio Dashboard security",
  () => {
    test(
      "anonymous users cannot access Portfolio Dashboard",
      async ({
        request,
      }) => {
        const response =
          await request.get(
            "/projects/not-a-real-project/portfolio",
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
