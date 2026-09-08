import {
  expect,
  test,
} from "@playwright/test";


test.describe(
  "account security",
  () => {
    test(
      "account security page rejects anonymous access",
      async ({
        request,
      }) => {
        const response =
          await request.get(
            "/account/security",
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
