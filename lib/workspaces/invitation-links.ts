import { prisma } from "@/lib/db/prisma";
import {
  createInvitationToken,
  hashInvitationToken,
  invitationExpiry,
} from "@/lib/workspaces/invitations";

/**
 * Creates a link for one email address in one workspace and returns the link's secret part.
 * A workspace keeps only one link that has not been used for each address: the older ones are
 * removed in the same database transaction, so the old link stops working at once.
 * Links that were already accepted are never touched.
 */
export async function createInvitationLink(input: {
  workspaceId: string;

  email: string;

  role: "EDITOR" | "VIEWER";

  createdByUserId: string;
}): Promise<string> {
  const token = createInvitationToken();

  await prisma.$transaction([
    prisma.workspaceInvitation.deleteMany({
      where: {
        workspaceId: input.workspaceId,

        emailNormalized: input.email,

        acceptedAt: null,
      },
    }),

    prisma.workspaceInvitation.create({
      data: {
        workspaceId: input.workspaceId,

        emailNormalized: input.email,

        role: input.role,

        tokenHash: hashInvitationToken(token),

        expiresAt: invitationExpiry(),

        createdByUserId: input.createdByUserId,
      },
    }),
  ]);

  return token;
}
