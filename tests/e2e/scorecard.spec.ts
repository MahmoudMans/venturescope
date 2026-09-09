import {
  expect,
  test,
} from "@playwright/test";


test.describe(
  "Management Scorecard security",
  () => {
    test(
      "anonymous users cannot access Scorecard",
      async ({
        request,
      }) => {
        const response =
          await request.get(
            "/projects/not-a-real-project/scorecard",
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
