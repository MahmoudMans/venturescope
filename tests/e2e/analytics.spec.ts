import {
  expect,
  test,
} from "@playwright/test";


test.describe(
  "advanced financial analytics security",
  () => {
    test(
      "anonymous users cannot access project analytics",
      async ({
        request,
      }) => {
        const response =
          await request.get(
            "/projects/not-a-real-project/analytics",
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
