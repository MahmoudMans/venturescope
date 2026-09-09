import {
  expect,
  test,
} from "@playwright/test";


test.describe(
  "Scenario Comparison security",
  () => {
    test(
      "anonymous users cannot access Scenario Comparison",
      async ({
        request,
      }) => {
        const response =
          await request.get(
            "/projects/not-a-real-project/scenario-comparison",
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
