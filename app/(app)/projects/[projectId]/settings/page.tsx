import type {
  Metadata,
} from "next";
import {
  CalendarClock,
  Database,
  Layers3,
  SlidersHorizontal,
} from "lucide-react";

import {
  FinancialKpiCard,
} from "@/components/financial/financial-kpi-card";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  formatProjectUpdatedAt,
} from "@/lib/projects/project-dates";

export const metadata: Metadata = {
  title:
    "Project settings",
};

export default async function ProjectSettingsPage({
  params,
}: {
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
            value="Private to authenticated owner"
          />
        </CardContent>
      </Card>

      <ModelGovernance
        projectId={
          project.id
        }
      />
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
