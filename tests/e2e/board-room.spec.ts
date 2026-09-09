import {
  expect,
  test,
} from "@playwright/test";


test.describe(
  "Board Room security",
  () => {
    test(
      "anonymous users cannot access Board Room",
      async ({
        request,
      }) => {
        const response =
          await request.get(
            "/projects/not-a-real-project/board-room",
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
