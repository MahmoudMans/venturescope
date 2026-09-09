import type {
  MetadataRoute,
} from "next";

import {
  getPublicSiteUrl,
} from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  const site =
    getPublicSiteUrl()
      .toString()
      .replace(
        /\/$/,
        "",
      );

  return {
    rules: {
      userAgent:
        "*",

      allow: [
        "/",
        "/demo",
        "/login",
        "/register",
      ],

      disallow: [
        "/api/",
        "/dashboard",
        "/dashboard/",
        "/projects",
        "/projects/",
        "/workspaces",
        "/workspaces/",
        "/invite",
        "/invite/",
      ],
    },

    sitemap:
      `${site}/sitemap.xml`,
  };
}
