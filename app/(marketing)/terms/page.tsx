import type { Metadata } from "next";

import { DocumentPage } from "@/components/site/document-page";
import { PublicPageShell } from "@/components/site/public-page-shell";
import { getSupportEmail } from "@/lib/site/support";
import { TERMS_INTRO, TERMS_SECTIONS } from "@/lib/site/terms-content";

export const metadata: Metadata = {
  title: "Terms of use",

  description: "The rules for using VentureScope.",

  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <PublicPageShell>
      <DocumentPage
        eyebrow="Legal"
        title="Terms of use"
        intro={TERMS_INTRO}
        sections={TERMS_SECTIONS}
        supportEmail={getSupportEmail()}
      />
    </PublicPageShell>
  );
}
