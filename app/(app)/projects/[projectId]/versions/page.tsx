import type {
  Metadata,
} from "next";

import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import {
  PendingButton,
} from "@/components/forms/pending-button";

import {
  prisma,
} from "@/lib/db/prisma";

import {
  requireCurrentUserIdentity,
} from "@/lib/auth/current-user";

import {
  getOwnedProject,
  getProjectForEditor,
} from "@/lib/projects/project-access";

import {
  createProjectRevisionAction,
  restoreProjectRevisionAction,
} from "./actions";


export const metadata: Metadata = {
  title:
    "Model Version History",

  robots: {
    index:
      false,

    follow:
      false,
  },
};


function formatDate(
  value:
    Date,
): string {
  return new Intl.DateTimeFormat(
    "en",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    },
  ).format(
    value,
  );
}


export default async function ProjectVersionsPage({
  params,
  searchParams,
}: {
  params:
    Promise<{
      projectId:
        string;
    }>;

  searchParams:
    Promise<{
      status?:
        string;

      version?:
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


  const editable =
    Boolean(
      await getProjectForEditor(
        user.id,
        projectId,
      ),
    );


  const [
    revisionState,
    revisions,
  ] =
    await Promise.all([
      prisma.project.findUnique({
        where: {
          id:
            projectId,
        },

        select: {
          revisionSequence:
            true,
        },
      }),

      prisma.projectRevision.findMany({
        where: {
          projectId,
        },

        include: {
          createdBy: {
            select: {
              name:
                true,

              email:
                true,
            },
          },
        },

        orderBy: {
          version:
            "desc",
        },
      }),
    ]);


  if (
    !revisionState
  ) {
    notFound();
  }


  const status =
    await searchParams;


  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <header className="space-y-3">
        <Link
          href={
            `/projects/${project.id}/settings`
          }
          className="touch-reach text-sm text-muted-foreground hover:text-foreground"
        >
          ← Project settings
        </Link>

        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Model governance
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Version history
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Create immutable checkpoints and restore an earlier financial model without rewriting history.
          </p>
        </div>

        <div className="inline-flex rounded-lg border px-3 py-2 text-sm">
          Current checkpoint sequence:{" "}
          <strong className="ml-1">
            v{
              revisionState
                .revisionSequence
            }
          </strong>
        </div>
      </header>

      {
        status.status
          ?
            (
              <div
                role="status"
                className="rounded-xl border bg-muted/40 px-4 py-3 text-sm"
              >
                {
                  status.status ===
                  "restored"
                    ?
                      `Model restored successfully as revision ${status.version ?? ""}.`
                    :
                      `Checkpoint ${status.version ?? ""} created successfully.`
                }
              </div>
            )
          :
            null
      }

      {
        editable
          ?
            (
              <section className="rounded-xl border bg-background p-5 sm:p-6">
                <h2 className="font-semibold">
                  Create checkpoint
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Save the complete current financial model as an immutable revision.
                </p>

                <form
                  action={
                    createProjectRevisionAction
                  }
                  className="mt-5 space-y-4"
                >
                  <input
                    type="hidden"
                    name="projectId"
                    value={
                      projectId
                    }
                  />

                  <label className="block space-y-2">
                    <span className="text-sm font-medium">
                      Label
                    </span>

                    <input
                      name="label"
                      maxLength={
                        80
                      }
                      placeholder="Board-approved plan"
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium">
                      Reason or note
                    </span>

                    <textarea
                      name="reason"
                      maxLength={
                        500
                      }
                      rows={
                        3
                      }
                      placeholder="Optional context for this checkpoint"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    />
                  </label>

                  <PendingButton
                    className="h-10 rounded-lg bg-foreground px-4 text-sm font-medium text-background"
                  >
                    Create immutable checkpoint
                  </PendingButton>
                </form>
              </section>
            )
          :
            (
              <section className="rounded-xl border bg-muted/30 p-5 text-sm text-muted-foreground">
                You have Viewer access. History is visible, but creating or restoring checkpoints requires Editor permission.
              </section>
            )
      }

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">
            Revision history
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Restoring an old checkpoint creates a new revision. Existing history is never changed.
          </p>
        </div>

        {
          revisions.length ===
          0
            ?
              (
                <div className="rounded-xl border border-dashed p-8 text-sm text-muted-foreground">
                  No immutable checkpoints exist yet.
                </div>
              )
            :
              (
                <div className="space-y-3">
                  {
                    revisions.map(
                      (
                        revision,
                      ) => (
                        <article
                          key={
                            revision.id
                          }
                          className="rounded-xl border bg-background p-5"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="rounded-md border px-2 py-1 text-xs font-semibold">
                                  v{
                                    revision.version
                                  }
                                </span>

                                {
                                  revision.sourceRevisionId
                                    ?
                                      (
                                        <span className="text-xs text-muted-foreground">
                                          restored revision
                                        </span>
                                      )
                                    :
                                      null
                                }
                              </div>

                              <h3 className="mt-3 font-semibold">
                                {
                                  revision.label ??
                                  `Model checkpoint v${revision.version}`
                                }
                              </h3>

                              {
                                revision.reason
                                  ?
                                    (
                                      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                        {
                                          revision.reason
                                        }
                                      </p>
                                    )
                                  :
                                    null
                              }

                              <p className="mt-3 text-xs text-muted-foreground">
                                {
                                  formatDate(
                                    revision.createdAt,
                                  )
                                }
                                {" · "}
                                {
                                  revision.createdBy?.name ??
                                  revision.createdBy?.email ??
                                  "Former collaborator"
                                }
                              </p>
                            </div>

                            {
                              editable
                                ?
                                  (
                                    <form
                                      action={
                                        restoreProjectRevisionAction
                                      }
                                      className="space-y-2"
                                    >
                                      <input
                                        type="hidden"
                                        name="projectId"
                                        value={
                                          projectId
                                        }
                                      />

                                      <input
                                        type="hidden"
                                        name="revisionId"
                                        value={
                                          revision.id
                                        }
                                      />

                                      <input
                                        name="reason"
                                        maxLength={
                                          500
                                        }
                                        placeholder="Restore reason"
                                        aria-label="Reason for restoring this revision"
                                        className="h-9 w-48 rounded-lg border bg-background px-3 text-xs"
                                      />

                                      <PendingButton
                                        className="block h-9 w-full rounded-lg border px-3 text-xs font-medium"
                                      >
                                        Restore as new revision
                                      </PendingButton>
                                    </form>
                                  )
                                :
                                  null
                            }
                          </div>
                        </article>
                      ),
                    )
                  }
                </div>
              )
        }
      </section>
    </div>
  );
}
