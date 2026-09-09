import {
  expect,
  test,
} from "@playwright/test";


test.describe(
  "Capital Planning security",
  () => {
    test(
      "anonymous users cannot access Capital Planning",
      async ({
        request,
      }) => {
        const response =
          await request.get(
            "/projects/not-a-real-project/capital-planning",
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
