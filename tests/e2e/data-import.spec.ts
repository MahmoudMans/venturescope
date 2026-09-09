import {
  expect,
  test,
} from "@playwright/test";


test.describe(
  "Data Import Center security",
  () => {
    test(
      "anonymous users cannot access Data Import Center",
      async ({
        request,
      }) => {
        const response =
          await request.get(
            "/projects/not-a-real-project/imports",
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
