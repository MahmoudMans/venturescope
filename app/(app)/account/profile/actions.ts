"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { normalizeDisplayName } from "@/lib/account/profile";
import { requireCurrentUserIdentity } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { logStructured } from "@/lib/observability/logger";

export async function updateProfileAction(formData: FormData): Promise<void> {
  const user = await requireCurrentUserIdentity();

  const raw = formData.get("name");

  const result = normalizeDisplayName(typeof raw === "string" ? raw : "");

  if (result.ok === false) {
    redirect("/account/profile?status=invalid-name");
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },

    data: {
      name: result.name,
    },
  });

  logStructured("info", "account.profile", {
    action: "profile.updated",
    actorUserId: user.id,
  });

  // The sidebar shows the name, so refresh every page that uses the app layout.
  revalidatePath("/", "layout");

  redirect("/account/profile?status=profile-saved");
}
