"use client";

import { ErrorState } from "@/components/app/error-state";

/** Catches a failed page outside the signed-in app, for example the sign-in page or the Help page. */
export default function SiteError({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorState area="site" scope="page" error={error} retry={retry} />;
}
