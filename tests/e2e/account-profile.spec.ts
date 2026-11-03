import { expect, test } from "@playwright/test";

test.describe("account profile", () => {
  test("profile page rejects anonymous access", async ({ request }) => {
    const response = await request.get("/account/profile", {
      maxRedirects: 0,
    });

    expect([302, 303, 307, 308]).toContain(response.status());

    expect(response.headers()["location"]).toMatch(/\/login/);
  });
});
