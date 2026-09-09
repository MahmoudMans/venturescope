import {
  expect,
  test,
} from "@playwright/test";


test.describe(
  "Variance Review security",
  () => {
    test(
      "anonymous users cannot access Variance Review",
      async ({
        request,
      }) => {
        const response =
          await request.get(
            "/projects/not-a-real-project/variance-review",
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
