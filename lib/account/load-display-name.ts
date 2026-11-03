import { cache } from "react";

import { pickDisplayName } from "@/lib/account/display-name";
import { prisma } from "@/lib/db/prisma";

/**
 * The saved display name of a person, read once per request however many
 * components ask. Falls back to the name stored in the session.
 */
export const loadDisplayName = cache(
  async (userId: string, sessionName: string | null | undefined): Promise<string> => {
    const profile = await prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        name: true,
      },
    });

    return pickDisplayName(profile?.name, sessionName);
  },
);
