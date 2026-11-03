import type {
  MetadataRoute,
} from "next";

import {
  getPublicSiteUrl,
} from "@/lib/seo/site";
import {
  PUBLIC_INFO_LINKS,
} from "@/lib/site/public-pages";

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
        ...PUBLIC_INFO_LINKS.map(
          (
            link,
          ) =>
            link.href,
        ),
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
