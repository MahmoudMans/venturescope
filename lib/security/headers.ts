export type SecurityHeader = {
  key: string;

  value: string;
};

export function buildContentSecurityPolicy(
  production: boolean,
): string {
  const scriptSource =
    production
      ? "'self' 'unsafe-inline'"
      : "'self' 'unsafe-inline' 'unsafe-eval'";

  const connectSource =
    production
      ? "'self'"
      : "'self' ws: wss:";

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "form-action 'self'",
    `script-src ${scriptSource}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${connectSource}`,
    "worker-src 'self' blob:",
    "media-src 'self' blob:",
    "manifest-src 'self'",
  ].join(
    "; ",
  );
}

export function buildSecurityHeaders(
  production: boolean,
): SecurityHeader[] {
  const headers: SecurityHeader[] =
    [
      {
        key:
          "Content-Security-Policy",

        value:
          buildContentSecurityPolicy(
            production,
          ),
      },

      {
        key:
          "Referrer-Policy",

        value:
          "strict-origin-when-cross-origin",
      },

      {
        key:
          "X-Content-Type-Options",

        value:
          "nosniff",
      },

      {
        key:
          "X-Frame-Options",

        value:
          "DENY",
      },

      {
        key:
          "X-DNS-Prefetch-Control",

        value:
          "off",
      },

      {
        key:
          "Permissions-Policy",

        value:
          [
            "camera=()",
            "microphone=()",
            "geolocation=()",
            "payment=()",
            "usb=()",
            "browsing-topics=()",
          ].join(
            ", ",
          ),
      },

      {
        key:
          "Cross-Origin-Opener-Policy",

        value:
          "same-origin",
      },

      {
        key:
          "Cross-Origin-Resource-Policy",

        value:
          "same-origin",
      },
    ];

  if (
    production
  ) {
    headers.push({
      key:
        "Strict-Transport-Security",

      value:
        "max-age=63072000; includeSubDomains; preload",
    });
  }

  return headers;
}
