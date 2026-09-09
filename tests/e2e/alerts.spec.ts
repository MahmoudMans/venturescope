import {
  expect,
  test,
} from "@playwright/test";


test.describe(
  "Alert Inbox security",
  () => {
    test(
      "anonymous users cannot access Alert Inbox",
      async ({
        request,
      }) => {
        const response =
          await request.get(
            "/projects/not-a-real-project/alerts",
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
