"use server";

import { signOut } from "@/auth";
import { authPageHref } from "@/lib/auth/return-path";

/**
 * For a person who opened an invitation while signed in with another email address: signs them out
 * and opens the sign-in page, which brings them back to the same invitation.
 */
export async function switchInvitationAccountAction(formData: FormData): Promise<void> {
  const token = formData.get("token");

  const target =
    typeof token === "string" && /^[A-Za-z0-9_-]{16,128}$/.test(token) ? `/invite/${token}` : null;

  // signOut ends with a redirect, so nothing may come after it.
  await signOut({
    redirectTo: authPageHref("/login", { next: target }),
  });
}
