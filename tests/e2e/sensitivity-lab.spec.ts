import {
  expect,
  test,
} from "@playwright/test";


test.describe(
  "Sensitivity Lab security",
  () => {
    test(
      "anonymous users cannot access Sensitivity Lab",
      async ({
        request,
      }) => {
        const response =
          await request.get(
            "/projects/not-a-real-project/sensitivity-lab",
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
