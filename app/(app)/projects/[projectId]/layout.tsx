import {
  ArrowLeft,
  CalendarRange,
  Coins,
  Layers3,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { PrintButton } from "@/components/app/print-button";
import { StatusNotice } from "@/components/app/status-notice";
import { ProjectActions } from "@/components/projects/project-actions";
import { ProjectMobileWorkspaceNav } from "@/components/projects/project-mobile-workspace-nav";
import { ProjectWorkspaceNav } from "@/components/projects/project-workspace-nav";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/require-user";
import { describeDeleteWarning, toDashboardSharing } from "@/lib/dashboard/model-sharing-status";
import { requireOwnedProject } from "@/lib/projects/project-access";
import { formatProjectStartMonth } from "@/lib/projects/project-dates";
import { formatRevenueMode } from "@/lib/projects/project-formatting";
import { workspaceRoleLabel } from "@/lib/workspaces/labels";
import { loadModelWorkspace } from "@/lib/workspaces/model-sharing-data";
import { getSharedProjectAccess } from "@/lib/workspaces/shared-access";
import { describeSharedAccess } from "@/lib/workspaces/shared-notice";

function HeaderChip({ icon: Icon, children }: { icon?: LucideIcon; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/70 px-2.5 py-1">
      {Icon ? <Icon className="size-3.5" aria-hidden="true" /> : null}

      {children}
    </span>
  );
}

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;

  params: Promise<{
    projectId: string;
  }>;
}) {
  const { projectId } = await params;

  const user = await requireUser();

  const project = await requireOwnedProject(user.id, projectId);

  // Rename, duplicate and delete belong to the person who owns the model.
  const isOwner = project.userId === user.id;

  const shared = isOwner ? null : await getSharedProjectAccess(user.id, project.id);

  // The owner sees on every page of the model that other people can open it.
  const ownerSharing = isOwner ? await loadModelWorkspace(user.id, project.id) : null;

  const sharedNotice = shared ? describeSharedAccess(shared) : null;

  return (
    <div className="min-h-[calc(100svh-4rem)]">
      <div className="border-b bg-background">
        <div className="relative overflow-hidden px-5 py-5 lg:px-8">
          <div
            aria-hidden="true"
            className="surface-glow pointer-events-none absolute inset-0 opacity-70 print:hidden"
          />

          <div className="relative flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
            <div className="flex min-w-0 items-start gap-4">
              <Button asChild variant="outline" size="icon" className="shrink-0 print:hidden">
                <Link href="/dashboard" aria-label="Back to financial models">
                  <ArrowLeft className="size-4" aria-hidden="true" />
                </Link>
              </Button>

              <div
                aria-hidden="true"
                className="hidden size-11 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-sm sm:flex"
              >
                <TrendingUp className="size-5" />
              </div>

              <div className="min-w-0">
                <h1 className="break-words text-xl font-semibold tracking-tight">{project.name}</h1>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <HeaderChip icon={Coins}>{project.currency}</HeaderChip>

                  <HeaderChip icon={CalendarRange}>
                    {project.horizonMonths} months from{" "}
                    {formatProjectStartMonth(project.startMonth)}
                  </HeaderChip>

                  <HeaderChip icon={Layers3}>{project.scenarios.length} scenarios</HeaderChip>

                  <HeaderChip>{formatRevenueMode(project.revenueMode)}</HeaderChip>

                  {shared ? (
                    <HeaderChip icon={Users}>
                      Shared in{" "}
                      <Link
                        href={`/workspaces/${shared.workspaceId}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {shared.workspaceName}
                      </Link>{" "}
                      &middot; {workspaceRoleLabel(shared.role)}
                    </HeaderChip>
                  ) : null}

                  {ownerSharing ? (
                    <HeaderChip icon={Users}>
                      Shared in{" "}
                      {ownerSharing.personIsInside ? (
                        <Link
                          href={`/workspaces/${ownerSharing.id}`}
                          className="font-medium text-foreground hover:underline"
                        >
                          {ownerSharing.name}
                        </Link>
                      ) : (
                        <span className="font-medium text-foreground">{ownerSharing.name}</span>
                      )}
                    </HeaderChip>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <PrintButton />

              {isOwner ? (
                <ProjectActions
                  projectId={project.id}
                  projectName={project.name}
                  returnTo={`/projects/${project.id}/overview`}
                  deleteWarning={describeDeleteWarning(toDashboardSharing(ownerSharing))}
                />
              ) : shared ? (
                <Button asChild variant="outline">
                  <Link href={`/workspaces/${shared.workspaceId}`}>
                    <Users className="size-4" aria-hidden="true" />
                    Open workspace
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[220px_minmax(0,1fr)] print:block">
        <div className="relative z-30 border-b px-4 py-3 lg:hidden print:hidden">
          <ProjectMobileWorkspaceNav projectId={project.id} />
        </div>

        <aside className="hidden border-r bg-background lg:block print:hidden">
          <div className="sticky top-16 max-h-[calc(100svh-4rem)] overflow-y-auto p-4">
            <ProjectWorkspaceNav projectId={project.id} />
          </div>
        </aside>

        <section className="min-w-0 bg-muted/20 print:bg-transparent">
          {sharedNotice ? (
            <div className="px-5 pt-5 lg:px-8 print:hidden">
              <StatusNotice tone="info" title={sharedNotice.title}>
                {sharedNotice.message}
              </StatusNotice>
            </div>
          ) : null}

          {children}
        </section>
      </div>
    </div>
  );
}
