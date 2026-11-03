import type {
  Metadata,
} from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { RegisterForm } from "@/components/auth/register-form";
import { DEFAULT_RETURN_PATH, safeReturnPath } from "@/lib/auth/return-path";

export const metadata: Metadata = {
  title: "Create account",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const session = await auth();

  const { next } = await searchParams;

  const returnTo = safeReturnPath(next);

  if (session?.user) {
    redirect(returnTo ?? DEFAULT_RETURN_PATH);
  }

  return <RegisterForm returnTo={returnTo} />;
}
