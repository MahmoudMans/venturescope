import type {
  NextConfig,
} from "next";

import {
  buildSecurityHeaders,
} from "./lib/security/headers";

const production =
  process.env.NODE_ENV ===
  "production";

const nextConfig: NextConfig = {
  output:
    "standalone",

  poweredByHeader:
    false,

  experimental: {
    serverActions: {
      bodySizeLimit:
        "512kb",
    },
  },

  async headers() {
    const securityHeaders =
      buildSecurityHeaders(
        production,
      );

    return [
      {
        source:
          "/(.*)",

        headers:
          securityHeaders,
      },

      {
        source:
          "/dashboard/:path*",

        headers: [
          {
            key:
              "X-Robots-Tag",

            value:
              "noindex, nofollow, noarchive",
          },
        ],
      },

      {
        source:
          "/projects/:path*",

        headers: [
          {
            key:
              "X-Robots-Tag",

            value:
              "noindex, nofollow, noarchive",
          },
        ],
      },

      {
        source:
          "/api/:path*",

        headers: [
          {
            key:
              "X-Robots-Tag",

            value:
              "noindex, nofollow, noarchive",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
