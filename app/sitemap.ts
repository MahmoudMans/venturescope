import type {
  MetadataRoute,
} from "next";

import {
  getPublicSiteUrl,
} from "@/lib/seo/site";

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
  ];
}
