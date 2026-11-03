import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { backupFilename, buildModelBackup } from "@/lib/projects/model-backup";
import { getOwnedProject } from "@/lib/projects/project-access";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

/**
 * Downloads a model as a backup file. Anyone who can open the model can
 * download it, because everything in the file is already on their screen.
 */
export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      projectId: string;
    }>;
  },
) {
  const session = await auth();

  const userId = session?.user?.id;

  if (userId === undefined || userId === "") {
    return new Response("Unauthorized", { status: 401 });
  }

  const { projectId } = await params;

  const visible = await getOwnedProject(userId, projectId);

  if (visible === null) {
    return new Response("Financial model not found.", { status: 404 });
  }

  const project = await prisma.project.findUnique({
    where: {
      id: visible.id,
    },

    include: {
      scenarios: {
        orderBy: {
          createdAt: "asc",
        },
      },

      financingEvents: {
        orderBy: {
          month: "asc",
        },
      },

      monthlyOverrides: {
        orderBy: {
          month: "asc",
        },
      },
    },
  });

  if (project === null) {
    return new Response("Financial model not found.", { status: 404 });
  }

  const body = `${JSON.stringify(buildModelBackup(project, new Date()), null, 2)}\n`;

  return new Response(body, {
    status: 200,

    headers: {
      "Content-Type": "application/json; charset=utf-8",

      "Content-Disposition": `attachment; filename="${backupFilename(project.name)}"`,

      "Cache-Control": "private, no-store, max-age=0",

      "X-Content-Type-Options": "nosniff",
    },
  });
}
