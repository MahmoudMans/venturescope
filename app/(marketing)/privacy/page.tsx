import type { Metadata } from "next";

import { DocumentPage } from "@/components/site/document-page";
import { PublicPageShell } from "@/components/site/public-page-shell";
import { PRIVACY_INTRO, PRIVACY_SECTIONS } from "@/lib/site/privacy-content";
import { getSupportEmail } from "@/lib/site/support";

export const metadata: Metadata = {
  title: "Privacy notice",

  description: "What VentureScope stores about you, why, and what you can do about it.",

  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <PublicPageShell>
      <DocumentPage
        eyebrow="Legal"
        title="Privacy notice"
        intro={PRIVACY_INTRO}
        sections={PRIVACY_SECTIONS}
        supportEmail={getSupportEmail()}
      />
    </PublicPageShell>
  );
}
