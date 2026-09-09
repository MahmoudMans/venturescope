import {
  expect,
  test,
} from "@playwright/test";


test.describe(
  "Approval Center security",
  () => {
    test(
      "anonymous users cannot access Approval Center",
      async ({
        request,
      }) => {
        const response =
          await request.get(
            "/projects/not-a-real-project/approvals",
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
