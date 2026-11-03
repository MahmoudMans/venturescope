import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { loginAddressForRequest } from "@/lib/auth/request-path";

export async function requireUser() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(await loginAddressForRequest());
  }

  return session.user;
}
