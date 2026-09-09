import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import {
  VersionDiffWorkspace,
} from "@/components/version-diff/version-diff-workspace";

import {
  requireCurrentUserIdentity,
} from "@/lib/auth/current-user";

import {
  prisma,
} from "@/lib/db/prisma";

import {
  getOwnedProject,
} from "@/lib/projects/project-access";

import {
  normalizeJsonValue,
} from "@/lib/projects/version-diff/json";


export const metadata: Metadata = {
  title:
    "Model Diff",

  robots: {
    index:
      false,

    follow:
      false,
  },
};


export default async function VersionDiffPage({
  params,
}: {
  params:
    Promise<{
      projectId:
        string;
    }>;
}) {
  const user =
    await requireCurrentUserIdentity();


  const {
    projectId,
  } =
    await params;


  const project =
    await getOwnedProject(
      user.id,
      projectId,
    );


  if (
    !project
  ) {
    notFound();
  }


  const storedRevisions =
    await prisma.projectRevision.findMany({
      where: {
        projectId,
      },

      orderBy: {
        version:
          "desc",
      },

      select: {
        id:
          true,

        version:
          true,

        label:
          true,

        reason:
          true,

        sourceRevisionId:
          true,

        createdAt:
          true,

        snapshot:
          true,
      },
    });


  const revisions =
    storedRevisions.map(
      (
        revision,
      ) => ({
        id:
          revision.id,

        version:
          revision.version,

        label:
          revision.label,

        reason:
          revision.reason,

        sourceRevisionId:
          revision.sourceRevisionId,

        createdAt:
          revision.createdAt
            .toISOString(),

        snapshot:
          normalizeJsonValue(
            revision.snapshot,
          ),
      }),
    );


  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <header>
        <p className="text-sm font-medium text-muted-foreground">
          Model governance
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Model Version Diff
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Compare immutable planning revisions, identify exactly what changed between checkpoints, and understand whether the change affected assumptions, scenarios, financing, overrides, or structural project settings.
        </p>
      </header>

      <VersionDiffWorkspace
        projectId={
          projectId
        }
        revisions={
          revisions
        }
      />
    </main>
  );
}
