import {
  ArrowLeft,
  CalendarRange,
  Coins,
  Layers3,
} from "lucide-react";
import Link from "next/link";

import {
  ProjectActions,
} from "@/components/projects/project-actions";
import {
  ProjectWorkspaceNav,
} from "@/components/projects/project-workspace-nav";
import {
  Badge,
} from "@/components/ui/badge";
import {
  Button,
} from "@/components/ui/button";
import {
  requireUser,
} from "@/lib/auth/require-user";
import {
  formatProjectStartMonth,
} from "@/lib/projects/project-dates";
import {
  formatRevenueMode,
} from "@/lib/projects/project-formatting";
import {
  requireOwnedProject,
} from "@/lib/projects/project-access";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;

  params: Promise<{
    projectId: string;
  }>;
}) {
  const {
    projectId,
  } = await params;

  const user =
    await requireUser();

  const project =
    await requireOwnedProject(
      user.id,
      projectId,
    );

  return (
    <div className="min-h-[calc(100svh-4rem)]">
      <div className="border-b bg-background">
        <div className="px-5 py-5 lg:px-8">
          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
            <div className="flex min-w-0 items-start gap-4">
              <Button
                asChild
                variant="outline"
                size="icon"
                className="shrink-0"
              >
                <Link
                  href="/dashboard"
                  aria-label="Back to financial models"
                >
                  <ArrowLeft
                    className="size-4"
                    aria-hidden="true"
                  />
                </Link>
              </Button>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-xl font-semibold tracking-tight">
                    {
                      project.name
                    }
                  </h1>

                  <Badge>
                    BASE
                  </Badge>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Coins
                      className="size-3.5"
                      aria-hidden="true"
                    />

                    {
                      project.currency
                    }
                  </span>

                  <span className="flex items-center gap-1.5">
                    <CalendarRange
                      className="size-3.5"
                      aria-hidden="true"
                    />

                    {
                      project.horizonMonths
                    }{" "}
                    months from{" "}
                    {formatProjectStartMonth(
                      project.startMonth,
                    )}
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Layers3
                      className="size-3.5"
                      aria-hidden="true"
                    />

                    {
                      project.scenarios
                        .length
                    }{" "}
                    scenarios
                  </span>

                  <span>
                    {formatRevenueMode(
                      project.revenueMode,
                    )}
                  </span>
                </div>
              </div>
            </div>

            <ProjectActions
              projectId={
                project.id
              }
              projectName={
                project.name
              }
              returnTo={`/projects/${project.id}/overview`}
            />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="border-b bg-background p-4 lg:min-h-[calc(100svh-9.5rem)] lg:border-b-0 lg:border-r">
          <ProjectWorkspaceNav
            projectId={
              project.id
            }
          />
        </aside>

        <section className="min-w-0 bg-muted/20">
          {children}
        </section>
      </div>
    </div>
  );
}
