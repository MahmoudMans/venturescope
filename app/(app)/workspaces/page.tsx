import { ArrowRight, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/app/page-header";
import { StatusNotice } from "@/components/app/status-notice";
import { SubmitButton } from "@/components/forms/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireCurrentUserIdentity } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { formatCount, getWorkspaceNotice, workspaceRoleLabel } from "@/lib/workspaces/labels";

import { createWorkspaceAction } from "./actions";

export const metadata: Metadata = {
  title: "Workspaces",

  robots: {
    index: false,

    follow: false,
  },
};

export default async function WorkspacesPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string | string[];
  }>;
}) {
  const user = await requireCurrentUserIdentity();

  const { status } = await searchParams;

  const notice = getWorkspaceNotice(status);

  const workspaces = await prisma.workspace.findMany({
    where: {
      OR: [
        {
          ownerId: user.id,
        },

        {
          members: {
            some: {
              userId: user.id,
            },
          },
        },
      ],
    },

    include: {
      members: {
        where: {
          userId: user.id,
        },

        select: {
          role: true,
        },
      },

      _count: {
        select: {
          projects: true,

          members: true,
        },
      },
    },

    orderBy: {
      updatedAt: "desc",
    },
  });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Collaboration"
        title="Workspaces"
        description="Share financial models with trusted collaborators while keeping personal projects private by default."
      />

      {notice ? <StatusNotice tone={notice.tone}>{notice.message}</StatusNotice> : null}

      <Card>
        <CardHeader>
          <h2 className="font-heading text-base font-medium leading-snug">Create workspace</h2>

          <CardDescription>
            A workspace groups financial models with the people who are allowed to open them.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form action={createWorkspaceAction} className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <Label htmlFor="workspace-name" className="sr-only">
                Workspace name
              </Label>

              <Input
                id="workspace-name"
                name="name"
                required
                minLength={2}
                maxLength={80}
                placeholder="Finance team"
                className="h-10"
              />
            </div>

            <SubmitButton size="lg" pendingLabel="Creating...">
              Create workspace
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      <section aria-label="Your workspaces" className="grid gap-4 md:grid-cols-2">
        {workspaces.map((workspace) => {
          const role =
            workspace.ownerId === user.id ? "OWNER" : (workspace.members[0]?.role ?? "VIEWER");

          return (
            <Link
              key={workspace.id}
              href={`/workspaces/${workspace.id}`}
              className="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Card className="h-full transition-shadow group-hover:ring-primary/40">
                <CardContent className="flex h-full flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      aria-hidden="true"
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground"
                    >
                      <Users className="size-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="break-words font-medium">{workspace.name}</h2>

                      <Badge variant={role === "OWNER" ? "default" : "secondary"} className="mt-1">
                        {workspaceRoleLabel(role)}
                      </Badge>
                    </div>

                    <ArrowRight
                      className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                      aria-hidden="true"
                    />
                  </div>

                  <p className="mt-auto text-sm text-muted-foreground">
                    {formatCount(workspace._count.projects, "project")} ·{" "}
                    {formatCount(workspace._count.members, "collaborator")}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}

        {workspaces.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center md:col-span-2">
            <Users className="size-8 text-muted-foreground" aria-hidden="true" />

            <p className="max-w-md text-sm text-muted-foreground">
              You do not belong to a collaborative workspace yet. Create one above, or open an
              invitation link that someone sent you.
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
