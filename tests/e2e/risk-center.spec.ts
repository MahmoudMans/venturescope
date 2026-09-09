import {
  expect,
  test,
} from "@playwright/test";


test.describe(
  "Liquidity Risk Center security",
  () => {
    test(
      "anonymous users cannot access the Risk Center",
      async ({
        request,
      }) => {
        const response =
          await request.get(
            "/projects/not-a-real-project/risk-center",
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
