import AxeBuilder from "@axe-core/playwright";
import {
  expect,
  test,
} from "@playwright/test";

const publicRoutes = [
  {
    route:
      "/",

    name:
      "landing page",
  },

  {
    route:
      "/demo",

    name:
      "public demo",
  },

  {
    route:
      "/login",

    name:
      "login page",
  },

  {
    route:
      "/register",

    name:
      "registration page",
  },
];

for (
  const {
    route,
    name,
  }
  of publicRoutes
) {
  test(
    `${name} has no serious or critical automated accessibility violations`,
    async ({
      page,
    }) => {
      const response =
        await page.goto(
          route,
        );

      expect(
        response?.status(),
      ).toBe(
        200,
      );

      const results =
        await new AxeBuilder({
          page,
        })
          .withTags([
            "wcag2a",
            "wcag2aa",
            "wcag21a",
            "wcag21aa",
          ])
          .analyze();

      const important =
        results.violations.filter(
          (
            violation,
          ) =>
            violation.impact ===
              "serious" ||
            violation.impact ===
              "critical",
        );

      expect(
        important,
        important
          .map(
            (
              violation,
            ) =>
              [
                violation.id,
                violation.impact,
                violation.help,
                ...violation.nodes.map(
                  (
                    node,
                  ) =>
                    `  ${node.target.join(
                      " ",
                    )}`,
                ),
              ].join(
                "\n",
              ),
          )
          .join(
            "\n\n",
          ),
      ).toEqual(
        [],
      );
    },
  );
}

test(
  "skip navigation is the first keyboard destination",
  async ({
    page,
  }) => {
    await page.goto(
      "/",
    );

    await page.keyboard.press(
      "Tab",
    );

    const skip =
      page.getByRole(
        "link",
        {
          name:
            "Skip to main content",
        },
      );

    await expect(
      skip,
    ).toBeFocused();

    await expect(
      skip,
    ).toBeVisible();
  },
);

test(
  "demo financial charts expose accessible descriptions",
  async ({
    page,
  }) => {
    await page.goto(
      "/demo",
    );

    await expect(
      page.getByRole(
        "img",
        {
          name:
            "Revenue and expenses by forecast month",
        },
      ),
    ).toBeVisible();

    await expect(
      page.getByRole(
        "img",
        {
          name:
            "Ending cash and financing inflows by forecast month",
        },
      ),
    ).toBeVisible();

    await expect(
      page.getByRole(
        "img",
        {
          name:
            "Monthly recurring revenue by forecast month",
        },
      ),
    ).toBeVisible();
  },
);

test(
  "public surfaces do not overflow a mobile viewport",
  async ({
    page,
  }) => {
    await page.setViewportSize({
      width:
        390,

      height:
        844,
    });

    for (
      const route
      of [
        "/",
        "/demo",
        "/login",
        "/register",
      ]
    ) {
      await page.goto(
        route,
      );

      const overflow =
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth >
            window.innerWidth +
              1,
        );

      expect(
        overflow,
        `${route} creates document-level horizontal overflow`,
      ).toBe(
        false,
      );
    }
  },
);

test(
  "reduced-motion preference collapses CSS transition durations",
  async ({
    page,
  }) => {
    await page.emulateMedia({
      reducedMotion:
        "reduce",
    });

    await page.goto(
      "/demo",
    );

    const duration =
      await page
        .getByRole(
          "link",
          {
            name:
              "Create account",
          },
        )
        .evaluate(
          (
            element,
          ) =>
            getComputedStyle(
              element,
            ).transitionDuration,
        );

    const seconds =
      Number.parseFloat(
        duration,
      );

    expect(
      Number.isFinite(
        seconds,
      ),
    ).toBe(
      true,
    );

    expect(
      seconds,
    ).toBeLessThanOrEqual(
      0.02,
    );
  },
);
