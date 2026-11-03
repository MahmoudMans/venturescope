import type { Metadata } from "next";

import { HelpCenter } from "@/components/site/help-center";
import { PublicPageShell } from "@/components/site/public-page-shell";
import { GLOSSARY, HELP_GROUPS } from "@/lib/site/help-content";
import { getSupportEmail } from "@/lib/site/support";

export const metadata: Metadata = {
  title: "Help center",

  description:
    "Answers about building a forecast, reading the numbers, working with a team and keeping your account safe.",

  alternates: {
    canonical: "/help",
  },
};

export default function HelpPage() {
  return (
    <PublicPageShell>
      <HelpCenter groups={HELP_GROUPS} glossary={GLOSSARY} supportEmail={getSupportEmail()} />
    </PublicPageShell>
  );
}
