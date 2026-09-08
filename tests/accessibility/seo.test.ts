import {
  afterEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  getPublicSiteUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
} from "@/lib/seo/site";

describe(
  "public product metadata",
  () => {
    const original =
      process.env
        .NEXT_PUBLIC_SITE_URL;

    afterEach(
      () => {
        if (
          original ===
          undefined
        ) {
          delete process.env
            .NEXT_PUBLIC_SITE_URL;
        }
        else {
          process.env.NEXT_PUBLIC_SITE_URL =
            original;
        }
      },
    );

    it(
      "has a stable public product identity",
      () => {
        expect(
          SITE_NAME,
        ).toBe(
          "VentureScope",
        );

        expect(
          SITE_DESCRIPTION.length,
        ).toBeGreaterThan(
          30,
        );
      },
    );

    it(
      "uses configured production origin",
      () => {
        process.env.NEXT_PUBLIC_SITE_URL =
          "https://venturescope.example.com";

        expect(
          getPublicSiteUrl()
            .toString(),
        ).toBe(
          "https://venturescope.example.com/",
        );
      },
    );
  },
);
