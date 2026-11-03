"use client";

import { ErrorState } from "@/components/app/error-state";

/** Catches a failed page inside the signed-in app. The menu around it keeps working. */
export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorState area="app" scope="app page" error={error} retry={retry} />;
}
