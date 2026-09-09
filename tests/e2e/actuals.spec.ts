import {
  expect,
  test,
} from "@playwright/test";


test.describe(
  "Actuals security",
  () => {
    test(
      "anonymous users cannot access Actuals",
      async ({
        request,
      }) => {
        const response =
          await request.get(
            "/projects/not-a-real-project/actuals",
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
