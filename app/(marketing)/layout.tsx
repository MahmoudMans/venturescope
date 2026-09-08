import type {
  Metadata,
} from "next";
import type {
  ReactNode,
} from "react";

import {
  getPublicSiteUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
} from "@/lib/seo/site";

export const metadata: Metadata = {
  metadataBase:
    getPublicSiteUrl(),

  title: {
    default:
      `${SITE_NAME} — Financial Planning & Scenario Simulation`,

    template:
      `%s | ${SITE_NAME}`,
  },

  description:
    SITE_DESCRIPTION,

  applicationName:
    SITE_NAME,

  category:
    "finance",

  keywords: [
    "financial planning",
    "startup financial model",
    "scenario analysis",
    "cash runway",
    "financial forecasting",
    "SaaS metrics",
    "VentureScope",
  ],

  openGraph: {
    type:
      "website",

    title:
      `${SITE_NAME} — Financial Planning & Scenario Simulation`,

    description:
      SITE_DESCRIPTION,

    siteName:
      SITE_NAME,

    url:
      "/",
  },

  twitter: {
    card:
      "summary",

    title:
      SITE_NAME,

    description:
      SITE_DESCRIPTION,
  },

  robots: {
    index:
      true,

    follow:
      true,
  },
};

export default function MarketingLayout({
  children,
}: {
  children:
    ReactNode;
}) {
  return children;
}
