import type {
  Metadata,
} from "next";

import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import {
  prisma,
} from "@/lib/db/prisma";

import {
  requireCurrentUserIdentity,
} from "@/lib/auth/current-user";

import {
  getWorkspacePermission,
} from "@/lib/workspaces/access";

import {
  assignProjectToWorkspaceAction,
  deleteWorkspaceAction,
  inviteWorkspaceMemberAction,
  removeProjectFromWorkspaceAction,
  removeWorkspaceMemberAction,
  revokeWorkspaceInvitationAction,
  updateWorkspaceMemberRoleAction,
} from "../actions";


export const metadata: Metadata = {
  title:
    "Workspace",

  robots: {
    index:
      false,

    follow:
      false,
  },
};


export default async function WorkspacePage({
  params,
  searchParams,
}: {
  params:
    Promise<{
      workspaceId:
        string;
    }>;

  searchParams:
    Promise<{
      invite?:
        string;
    }>;
}) {
  const user =
    await requireCurrentUserIdentity();


  const {
    workspaceId,
  } =
    await params;


  const permission =
    await getWorkspacePermission(
      workspaceId,
      user.id,
    );


  if (
    !permission
  ) {
    notFound();
  }


  const workspace =
    await prisma.workspace.findUnique({
      where: {
        id:
          workspaceId,
      },

      include: {
        owner: {
          select: {
            id:
              true,

            email:
              true,

            name:
              true,
          },
        },

        members: {
          include: {
            user: {
              select: {
                email:
                  true,

                name:
                  true,
              },
            },
          },

          orderBy: {
            createdAt:
              "asc",
          },
        },

        invitations: {
          where: {
            acceptedAt:
              null,

            expiresAt: {
              gt:
                new Date(),
            },
          },

          orderBy: {
            createdAt:
              "desc",
          },
        },

        projects: {
          select: {
            id:
              true,

            name:
              true,

            userId:
              true,
          },

          orderBy: {
            updatedAt:
              "desc",
          },
        },
      },
    });


  if (
    !workspace
  ) {
    notFound();
  }


  const ownedProjects =
    await prisma.project.findMany({
      where: {
        userId:
          user.id,

        OR: [
          {
            workspaceId:
              null,
          },

          {
            workspaceId: {
              not:
                workspaceId,
            },
          },
        ],
      },

      select: {
        id:
          true,

        name:
          true,
      },

      orderBy: {
        updatedAt:
          "desc",
      },
    });


  const {
    invite,
  } =
    await searchParams;


  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <header className="space-y-3">
        <Link
          href="/workspaces"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Workspaces
        </Link>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {
              permission
            }
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {
              workspace.name
            }
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Owner:{" "}
            {
              workspace.owner
                .name ??
              workspace.owner
                .email
            }
          </p>
        </div>
      </header>

      {
        invite
          ?
            (
              <section className="rounded-xl border bg-muted/30 p-5">
                <h2 className="font-semibold">
                  Invitation link created
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  Share this one-time relative link securely with the invited person:
                </p>

                <code className="mt-3 block overflow-x-auto rounded-lg bg-muted p-3 text-sm">
                  {
                    `/invite/${invite}`
                  }
                </code>
              </section>
            )
          :
            null
      }

      {
        permission ===
        "OWNER"
          ?
            (
              <section className="rounded-xl border bg-background p-5">
                <h2 className="font-semibold">
                  Invite collaborator
                </h2>

                <form
                  action={
                    inviteWorkspaceMemberAction
                  }
                  className="mt-4 grid gap-3 sm:grid-cols-[1fr_160px_auto]"
                >
                  <input
                    type="hidden"
                    name="workspaceId"
                    value={
                      workspace.id
                    }
                  />

                  <input
                    required
                    type="email"
                    name="email"
                    placeholder="collaborator@example.com"
                    className="h-10 rounded-lg border bg-background px-3 text-sm"
                  />

                  <select
                    name="role"
                    defaultValue="EDITOR"
                    className="h-10 rounded-lg border bg-background px-3 text-sm"
                  >
                    <option value="EDITOR">
                      Editor
                    </option>

                    <option value="VIEWER">
                      Viewer
                    </option>
                  </select>

                  <button
                    type="submit"
                    className="h-10 rounded-lg bg-foreground px-4 text-sm font-medium text-background"
                  >
                    Create invite
                  </button>
                </form>
              </section>
            )
          :
            null
      }

      <section className="rounded-xl border bg-background p-5">
        <h2 className="font-semibold">
          Projects
        </h2>

        <div className="mt-4 space-y-3">
          {
            workspace.projects.map(
              (
                project,
              ) => (
                <div
                  key={
                    project.id
                  }
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <Link
                    href={
                      `/projects/${project.id}/overview`
                    }
                    className="font-medium hover:underline"
                  >
                    {
                      project.name
                    }
                  </Link>

                  {
                    project.userId ===
                    user.id
                      ?
                        (
                          <form
                            action={
                              removeProjectFromWorkspaceAction
                            }
                          >
                            <input
                              type="hidden"
                              name="projectId"
                              value={
                                project.id
                              }
                            />

                            <button
                              type="submit"
                              className="text-xs text-muted-foreground hover:text-foreground"
                            >
                              Remove from workspace
                            </button>
                          </form>
                        )
                      :
                        null
                  }
                </div>
              ),
            )
          }

          {
            workspace.projects.length ===
            0
              ?
                (
                  <p className="text-sm text-muted-foreground">
                    No projects have been shared with this workspace.
                  </p>
                )
              :
                null
          }
        </div>

        {
          ownedProjects.length >
          0
            ?
              (
                <form
                  action={
                    assignProjectToWorkspaceAction
                  }
                  className="mt-5 flex flex-col gap-3 border-t pt-5 sm:flex-row"
                >
                  <input
                    type="hidden"
                    name="workspaceId"
                    value={
                      workspace.id
                    }
                  />

                  <select
                    required
                    name="projectId"
                    className="h-10 flex-1 rounded-lg border bg-background px-3 text-sm"
                  >
                    {
                      ownedProjects.map(
                        (
                          project,
                        ) => (
                          <option
                            key={
                              project.id
                            }
                            value={
                              project.id
                            }
                          >
                            {
                              project.name
                            }
                          </option>
                        ),
                      )
                    }
                  </select>

                  <button
                    type="submit"
                    className="h-10 rounded-lg border px-4 text-sm font-medium"
                  >
                    Share project
                  </button>
                </form>
              )
            :
              null
        }
      </section>

      <section className="rounded-xl border bg-background p-5">
        <h2 className="font-semibold">
          Collaborators
        </h2>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">
                {
                  workspace.owner
                    .name ??
                  workspace.owner
                    .email
                }
              </p>

              <p className="text-xs text-muted-foreground">
                {
                  workspace.owner
                    .email
                }
              </p>
            </div>

            <span className="text-xs font-medium">
              OWNER
            </span>
          </div>

          {
            workspace.members.map(
              (
                member,
              ) => (
                <div
                  key={
                    member.id
                  }
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {
                        member.user
                          .name ??
                        member.user
                          .email
                      }
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {
                        member.user
                          .email
                      }
                    </p>
                  </div>

                  {
                    permission ===
                    "OWNER"
                      ?
                        (
                          <div className="flex gap-2">
                            <form
                              action={
                                updateWorkspaceMemberRoleAction
                              }
                              className="flex gap-2"
                            >
                              <input
                                type="hidden"
                                name="workspaceId"
                                value={
                                  workspace.id
                                }
                              />

                              <input
                                type="hidden"
                                name="memberId"
                                value={
                                  member.id
                                }
                              />

                              <select
                                name="role"
                                defaultValue={
                                  member.role
                                }
                                className="h-9 rounded-lg border bg-background px-2 text-xs"
                              >
                                <option value="EDITOR">
                                  Editor
                                </option>

                                <option value="VIEWER">
                                  Viewer
                                </option>
                              </select>

                              <button
                                type="submit"
                                className="h-9 rounded-lg border px-3 text-xs"
                              >
                                Save
                              </button>
                            </form>

                            <form
                              action={
                                removeWorkspaceMemberAction
                              }
                            >
                              <input
                                type="hidden"
                                name="workspaceId"
                                value={
                                  workspace.id
                                }
                              />

                              <input
                                type="hidden"
                                name="memberId"
                                value={
                                  member.id
                                }
                              />

                              <button
                                type="submit"
                                className="h-9 rounded-lg border px-3 text-xs text-destructive"
                              >
                                Remove
                              </button>
                            </form>
                          </div>
                        )
                      :
                        (
                          <span className="text-xs font-medium">
                            {
                              member.role
                            }
                          </span>
                        )
                  }
                </div>
              ),
            )
          }
        </div>
      </section>

      {
        permission ===
        "OWNER"
          ?
            (
              <section className="rounded-xl border bg-background p-5">
                <h2 className="font-semibold">
                  Pending invitations
                </h2>

                <div className="mt-4 space-y-3">
                  {
                    workspace.invitations.map(
                      (
                        invitation,
                      ) => (
                        <div
                          key={
                            invitation.id
                          }
                          className="flex items-center justify-between gap-3 rounded-lg border p-3"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {
                                invitation.emailNormalized
                              }
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {
                                invitation.role
                              }
                            </p>
                          </div>

                          <form
                            action={
                              revokeWorkspaceInvitationAction
                            }
                          >
                            <input
                              type="hidden"
                              name="workspaceId"
                              value={
                                workspace.id
                              }
                            />

                            <input
                              type="hidden"
                              name="invitationId"
                              value={
                                invitation.id
                              }
                            />

                            <button
                              type="submit"
                              className="text-xs text-destructive"
                            >
                              Revoke
                            </button>
                          </form>
                        </div>
                      ),
                    )
                  }

                  {
                    workspace.invitations.length ===
                    0
                      ?
                        (
                          <p className="text-sm text-muted-foreground">
                            No pending invitations.
                          </p>
                        )
                      :
                        null
                  }
                </div>
              </section>
            )
          :
            null
      }

      {
        permission ===
        "OWNER"
          ?
            (
              <section className="rounded-xl border border-destructive/40 bg-destructive/5 p-5">
                <h2 className="font-semibold text-destructive">
                  Delete workspace
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  Projects are returned to their personal owners; the financial models themselves are not deleted.
                </p>

                <form
                  action={
                    deleteWorkspaceAction
                  }
                  className="mt-4"
                >
                  <input
                    type="hidden"
                    name="workspaceId"
                    value={
                      workspace.id
                    }
                  />

                  <button
                    type="submit"
                    className="h-10 rounded-lg bg-destructive px-4 text-sm font-medium text-destructive-foreground"
                  >
                    Delete workspace
                  </button>
                </form>
              </section>
            )
          :
            null
      }
    </main>
  );
}
