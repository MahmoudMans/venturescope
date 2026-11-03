import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { safeReturnPath } from "@/lib/auth/return-path";

export const metadata: Metadata = {
  title: "Reset password",

  robots: {
    index: false,

    follow: false,
  },
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const session = await auth();

  // A signed-in person can look at the key and change the password from the account pages.
  if (session?.user) {
    redirect("/account/security");
  }

  const { next } = await searchParams;

  // The page the person wanted before they had to sign in, for example an invitation.
  return <ResetPasswordForm returnTo={safeReturnPath(next)} />;
}
