import {
  expect,
  test,
} from "@playwright/test";


test.describe(
  "forecast accuracy security",
  () => {
    test(
      "anonymous users cannot access forecast accuracy",
      async ({
        request,
      }) => {
        const response =
          await request.get(
            "/projects/not-a-real-project/forecast-accuracy",
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
