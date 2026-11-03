import type {
  MetadataRoute,
} from "next";

import {
  getPublicSiteUrl,
} from "@/lib/seo/site";
import {
  INFO_PAGES_UPDATED_ISO,
  PUBLIC_INFO_LINKS,
} from "@/lib/site/public-pages";

export default function sitemap(): MetadataRoute.Sitemap {
  const site =
    getPublicSiteUrl()
      .toString()
      .replace(
        /\/$/,
        "",
      );

  return [
    {
      url:
        `${site}/`,

      lastModified:
        new Date(),

      changeFrequency:
        "weekly",

      priority:
        1,
    },

    {
      url:
        `${site}/demo`,

      lastModified:
        new Date(),

      changeFrequency:
        "monthly",

      priority:
        0.9,
    },

    ...PUBLIC_INFO_LINKS.map(
      (
        link,
      ) => ({
        url:
          `${site}${link.href}`,

        lastModified:
          new Date(
            INFO_PAGES_UPDATED_ISO,
          ),

        changeFrequency:
          "yearly" as const,

        priority:
          0.5,
      }),
    ),
  ];
}
