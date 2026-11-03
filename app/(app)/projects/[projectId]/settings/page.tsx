import type {
  Metadata,
} from "next";
import {
  CalendarClock,
  Database,
  Download,
  Layers3,
  SlidersHorizontal,
} from "lucide-react";

import {
  FinancialKpiCard,
} from "@/components/financial/financial-kpi-card";
import {
  StatusNotice,
} from "@/components/app/status-notice";
import {
  FinancialPageHeader,
} from "@/components/financial/financial-page-header";
import {
  ModelGovernance,
} from "@/components/settings/model-governance";
import {
  ProjectSettingsForm,
} from "@/components/settings/project-settings-form";
import {
  Button,
} from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ModelSharingCard,
} from "@/components/workspaces/model-sharing-card";
import {
  requireUser,
} from "@/lib/auth/require-user";
import {
  countCompletedAssumptionSections,
  parseStoredFinancialAssumptions,
} from "@/lib/finance/assumptions/storage";
import {
  requireOwnedProject,
} from "@/lib/projects/project-access";
import {
  dateToMonthInput,
  formatProjectStartMonth,
  formatProjectUpdatedAt,
} from "@/lib/projects/project-dates";
import {
  formatRevenueMode,
} from "@/lib/projects/project-formatting";
import {
  getWorkspaceNotice,
} from "@/lib/workspaces/labels";
import {
  describeOwnership,
  settingsOwnerMessage,
} from "@/lib/workspaces/model-sharing";
import {
  loadModelSharing,
} from "@/lib/workspaces/model-sharing-data";
import {
  getSharedProjectAccess,
} from "@/lib/workspaces/shared-access";

import Link from "next/link";

export const metadata: Metadata = {
  title:
    "Project settings",
};

export default async function ProjectSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{
    projectId: string;
  }>;

  searchParams: Promise<{
    status?: string | string[];
  }>;
}) {
  const {
    projectId,
  } = await params;

  const {
    status,
  } = await searchParams;

  const user =
    await requireUser();

  const project =
    await requireOwnedProject(
      user.id,
      projectId,
    );

  // Only the person who owns the model changes its settings and decides who can open it.
  const isOwner =
    project.userId ===
    user.id;

  const notice =
    getWorkspaceNotice(
      status,
    );

  const sharing =
    isOwner
      ? await loadModelSharing(
          user.id,
          project.id,
        )
      : null;

  const shared =
    isOwner
      ? null
      : await getSharedProjectAccess(
          user.id,
          project.id,
        );

  const sharedIn =
    sharing !== null &&
    sharing.kind ===
      "shared"
      ? sharing.workspaceName
      : null;

  const ownership =
    describeOwnership({
      isOwner,

      workspaceName:
        isOwner
          ? sharedIn
          : (shared?.workspaceName ?? null),

      ownerName:
        shared?.ownerName,
    });

  const assumptions =
    parseStoredFinancialAssumptions(
      project.baseAssumptions,
    );

  const completed =
    countCompletedAssumptionSections(
      assumptions,
    );

  const customScenarioCount =
    project.scenarios.filter(
      (
        scenario,
      ) =>
        scenario.type ===
        "CUSTOM",
    ).length;

  return (
    <div className="mx-auto max-w-6xl space-y-9 px-5 py-8 lg:px-8 lg:py-10">
      <FinancialPageHeader
        eyebrow="Output"
        title="Project settings"
        description="Manage financial-model metadata, structural settings and explicit governance operations."
        scenarioName={`Model v${project.modelVersion}`}
      />

      {notice ? (
        <StatusNotice tone={notice.tone}>
          {notice.message}
        </StatusNotice>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FinancialKpiCard
          label="Assumptions"
          value={`${completed}/3`}
          detail="Configured model-input sections."
          icon={
            SlidersHorizontal
          }
        />

        <FinancialKpiCard
          label="Scenarios"
          value={String(
            project.scenarios
              .length,
          )}
          detail={`${customScenarioCount} custom scenarios.`}
          icon={
            Layers3
          }
        />

        <FinancialKpiCard
          label="Planning events"
          value={String(
            project._count
              .financingEvents +
            project._count
              .monthlyOverrides,
          )}
          detail={`${project._count.financingEvents} financing + ${project._count.monthlyOverrides} overrides.`}
          icon={
            CalendarClock
          }
        />

        <FinancialKpiCard
          label="Model version"
          value={
            project.modelVersion
          }
          detail="Financial calculation contract version."
          icon={
            Database
          }
        />
      </section>

      {isOwner && sharing !== null ? (
        <ModelSharingCard
          projectId={project.id}
          projectName={project.name}
          sharing={sharing}
        />
      ) : null}

      {isOwner ? (
        <ProjectSettingsForm
          project={{
            id:
              project.id,

            name:
              project.name,

            industry:
              project.industry,

            currency:
              project.currency,

            horizonMonths:
              project.horizonMonths,

            revenueMode:
              project.revenueMode,
          }}
          startMonth={dateToMonthInput(
            project.startMonth,
          )}
        />
      ) : (
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>
              Model settings
            </CardTitle>

            <CardDescription>
              {settingsOwnerMessage(
                shared?.ownerName,
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <MetadataRow
              label="Name"
              value={
                project.name
              }
            />

            <MetadataRow
              label="Industry"
              value={
                project.industry ??
                "Not set"
              }
            />

            <MetadataRow
              label="Currency"
              value={
                project.currency
              }
            />

            <MetadataRow
              label="Start month"
              value={formatProjectStartMonth(
                project.startMonth,
              )}
            />

            <MetadataRow
              label="Horizon"
              value={`${project.horizonMonths} months`}
            />

            <MetadataRow
              label="Revenue mode"
              value={formatRevenueMode(
                project.revenueMode,
              )}
            />
          </CardContent>
        </Card>
      )}

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>
            Model metadata
          </CardTitle>

          <CardDescription>
            Operational metadata for reproducibility and governance.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <MetadataRow
            label="Project ID"
            value={
              project.id
            }
          />

          <MetadataRow
            label="Model version"
            value={
              project.modelVersion
            }
          />

          <MetadataRow
            label="Created"
            value={formatProjectUpdatedAt(
              project.createdAt,
            )}
          />

          <MetadataRow
            label="Last updated"
            value={formatProjectUpdatedAt(
              project.updatedAt,
            )}
          />

          <MetadataRow
            label="Persistent forecast outputs"
            value="No — regenerated deterministically"
          />

          <MetadataRow
            label="Project ownership"
            value={
              ownership
            }
          />
        </CardContent>
      </Card>

      <ModelGovernance
        canChange={isOwner}
        projectId={
          project.id
        }
      />
    

      <section className="rounded-xl border bg-background p-5 sm:p-6">
        <h2 className="text-lg font-semibold">
          Model version history
        </h2>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Create immutable checkpoints, inspect historical revisions, and restore an earlier financial model safely.
        </p>

        <Link
          href={`/projects/${project.id}/versions`}
          className="touch-link mt-4 inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-medium"
        >
          Open version history
        </Link>
      </section>

      <section className="rounded-xl border bg-background p-5 sm:p-6">
        <h2 className="text-lg font-semibold">
          Model backup
        </h2>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Download this model as a file with its settings, assumptions, scenarios, financing and
          month overrides. Restore the file later from the new model page; it comes back as a new
          model.
        </p>

        <Button asChild variant="outline" className="mt-4">
          <a href={`/api/projects/${project.id}/export/json`} download>
            <Download className="size-4" aria-hidden="true" />
            Download backup
          </a>
        </Button>
      </section>
</div>
  );
}

function MetadataRow({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-2 border-b pb-4 last:border-b-0 last:pb-0 sm:flex-row sm:items-center">
      <span className="text-sm text-muted-foreground">
        {
          label
        }
      </span>

      <span className="break-all text-sm font-medium">
        {
          value
        }
      </span>
    </div>
  );
}
