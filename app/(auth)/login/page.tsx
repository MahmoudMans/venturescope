import type {
  Metadata,
} from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";
import { getLoginNotice } from "@/lib/auth/login-notices";
import { DEFAULT_RETURN_PATH, safeReturnPath } from "@/lib/auth/return-path";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ security?: string | string[]; next?: string | string[] }>;
}) {
  const session = await auth();

  const { security, next } = await searchParams;

  const returnTo = safeReturnPath(next);

  if (session?.user) {
    redirect(returnTo ?? DEFAULT_RETURN_PATH);
  }

  return <LoginForm notice={getLoginNotice(security)} returnTo={returnTo} />;
}
