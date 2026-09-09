import {
  expect,
  test,
} from "@playwright/test";


test.describe(
  "model version history security",
  () => {
    test(
      "anonymous users cannot access version history",
      async ({
        request,
      }) => {
        const response =
          await request.get(
            "/projects/not-a-real-project/versions",
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
