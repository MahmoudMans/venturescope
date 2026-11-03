/** Shown at the top of the Privacy notice and the Terms. Change it when the text changes. */
export const INFO_PAGES_UPDATED = "October 16, 2026";

export const INFO_PAGES_UPDATED_ISO = "2026-10-16";

export type PublicInfoLink = {
  href: string;
  label: string;
  description: string;
};

/** The public pages that explain the product and its rules. */
export const PUBLIC_INFO_LINKS: readonly PublicInfoLink[] = [
  {
    href: "/help",
    label: "Help center",
    description: "Answers, key terms and how the numbers work",
  },

  {
    href: "/privacy",
    label: "Privacy",
    description: "What VentureScope stores and why",
  },

  {
    href: "/terms",
    label: "Terms",
    description: "The rules for using VentureScope",
  },
];
