import type { MetadataRoute } from "next";

import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Financial Planning & Scenario Simulation`,

    short_name: SITE_NAME,

    description: SITE_DESCRIPTION,

    start_url: "/dashboard",

    display: "standalone",

    background_color: "#fafafc",

    theme_color: "#4f46e5",

    icons: [
      {
        src: "/icon.svg",

        sizes: "any",

        type: "image/svg+xml",
      },
    ],
  };
}
