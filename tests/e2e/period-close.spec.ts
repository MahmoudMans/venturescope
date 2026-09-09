import {
  expect,
  test,
} from "@playwright/test";


test.describe(
  "Financial Close security",
  () => {
    test(
      "anonymous users cannot access Financial Close",
      async ({
        request,
      }) => {
        const response =
          await request.get(
            "/projects/not-a-real-project/period-close",
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
