import type {
  Metadata,
} from "next";

import Link from "next/link";

import {
  prisma,
} from "@/lib/db/prisma";

import {
  requireCurrentUserIdentity,
} from "@/lib/auth/current-user";

import {
  createWorkspaceAction,
} from "./actions";


export const metadata: Metadata = {
  title:
    "Workspaces",

  robots: {
    index:
      false,

    follow:
      false,
  },
};


export default async function WorkspacesPage() {
  const user =
    await requireCurrentUserIdentity();


  const workspaces =
    await prisma.workspace.findMany({
      where: {
        OR: [
          {
            ownerId:
              user.id,
          },

          {
            members: {
              some: {
                userId:
                  user.id,
              },
            },
          },
        ],
      },

      include: {
        members: {
          where: {
            userId:
              user.id,
          },

          select: {
            role:
              true,
          },
        },

        _count: {
          select: {
            projects:
              true,

            members:
              true,
          },
        },
      },

      orderBy: {
        updatedAt:
          "desc",
      },
    });


  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <header className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Collaboration
        </p>

        <h1 className="text-3xl font-semibold tracking-tight">
          Workspaces
        </h1>

        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Share financial models with trusted collaborators while keeping personal projects private by default.
        </p>
      </header>

      <section className="rounded-xl border bg-background p-5">
        <h2 className="font-semibold">
          Create workspace
        </h2>

        <form
          action={
            createWorkspaceAction
          }
          className="mt-4 flex flex-col gap-3 sm:flex-row"
        >
          <label className="flex-1">
            <span className="sr-only">
              Workspace name
            </span>

            <input
              required
              minLength={
                2
              }
              maxLength={
                80
              }
              name="name"
              placeholder="Finance team"
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            />
          </label>

          <button
            type="submit"
            className="h-10 rounded-lg bg-foreground px-4 text-sm font-medium text-background"
          >
            Create workspace
          </button>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {
          workspaces.map(
            (
              workspace,
            ) => {
              const role =
                workspace.ownerId ===
                user.id
                  ?
                    "OWNER"
                  :
                    workspace.members[
                      0
                    ]?.role ??
                    "VIEWER";


              return (
                <Link
                  key={
                    workspace.id
                  }
                  href={
                    `/workspaces/${workspace.id}`
                  }
                  className="rounded-xl border bg-background p-5 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-semibold">
                        {
                          workspace.name
                        }
                      </h2>

                      <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                        {
                          role
                        }
                      </p>
                    </div>

                    <span className="text-sm text-muted-foreground">
                      {
                        workspace._count
                          .projects
                      }{" "}
                      projects
                    </span>
                  </div>

                  <p className="mt-4 text-sm text-muted-foreground">
                    {
                      workspace._count
                        .members
                    }{" "}
                    collaborators
                  </p>
                </Link>
              );
            },
          )
        }

        {
          workspaces.length ===
          0
            ?
              (
                <div className="rounded-xl border border-dashed p-8 text-sm text-muted-foreground md:col-span-2">
                  You do not belong to a collaborative workspace yet.
                </div>
              )
            :
              null
        }
      </section>
    </main>
  );
}
