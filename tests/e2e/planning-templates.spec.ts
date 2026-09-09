import {
  expect,
  test,
} from "@playwright/test";


test.describe(
  "Planning Templates security",
  () => {
    test(
      "anonymous users cannot access Planning Templates",
      async ({
        request,
      }) => {
        const response =
          await request.get(
            "/projects/not-a-real-project/templates",
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
