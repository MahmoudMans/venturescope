import type { Metadata } from "next";

import { NotFoundState } from "@/components/app/not-found-state";
import { PublicPageShell } from "@/components/site/public-page-shell";

export const metadata: Metadata = {
  title: "Page not found",
};

/**
 * Shown for an address that leads nowhere, and for a public page that cannot be found.
 * It keeps the header and the footer of the public pages, so a visitor always has a way forward.
 */
export default function NotFound() {
  return (
    <PublicPageShell>
      <NotFoundState area="site" />
    </PublicPageShell>
  );
}
