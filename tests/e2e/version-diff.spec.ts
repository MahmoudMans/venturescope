import {
  expect,
  test,
} from "@playwright/test";


test.describe(
  "Model Diff security",
  () => {
    test(
      "anonymous users cannot access Model Diff",
      async ({
        request,
      }) => {
        const response =
          await request.get(
            "/projects/not-a-real-project/version-diff",
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
