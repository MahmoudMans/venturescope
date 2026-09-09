import {
  expect,
  test,
} from "@playwright/test";


test.describe(
  "workspace collaboration security",
  () => {
    test(
      "anonymous users cannot access workspace management",
      async ({
        request,
      }) => {
        const response =
          await request.get(
            "/workspaces",
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


    test(
      "anonymous users cannot consume invitation links",
      async ({
        request,
      }) => {
        const response =
          await request.get(
            "/invite/not-a-real-invitation",
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
