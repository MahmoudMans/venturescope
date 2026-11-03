import { headers } from "next/headers";

import { RETURN_PATH_HEADER, authPageHref } from "@/lib/auth/return-path";

/**
 * The address of the sign-in page for the request that is running. The proxy puts the page that
 * was asked for into a header, so a person who has to sign in comes back to that page.
 * Call this only while a page or an action is running.
 */
export async function loginAddressForRequest(): Promise<string> {
  const requestHeaders = await headers();

  return authPageHref("/login", {
    next: requestHeaders.get(RETURN_PATH_HEADER),
  });
}
