export const SITE_NAME =
  "VentureScope";

export const SITE_DESCRIPTION =
  "Financial planning and scenario simulation for startups and growing companies.";

export function getPublicSiteUrl(): URL {
  const raw =
    process.env
      .NEXT_PUBLIC_SITE_URL ??
    process.env
      .AUTH_URL ??
    "http://localhost:3000";

  try {
    return new URL(
      raw,
    );
  }
  catch {
    return new URL(
      "http://localhost:3000",
    );
  }
}
