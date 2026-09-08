import type {
  Metadata,
} from "next";
import {
  notFound,
} from "next/navigation";

import {
  AnalysisSetupRequired,
} from "@/components/financial/analysis-setup-required";
import {
  FinancialPageHeader,
} from "@/components/financial/financial-page-header";
import {
  ExecutiveReport,
} from "@/components/reports/executive-report";
import {
  ReportExportActions,
} from "@/components/reports/report-export-actions";
import {
  ScenarioSwitcher,
} from "@/components/scenarios/scenario-switcher";
import {
  requireUser,
} from "@/lib/auth/require-user";
import {
  loadReportContext,
} from "@/lib/reports/context";

export const metadata: Metadata = {
  title:
    "Reports",
};

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{
    projectId: string;
  }>;

  searchParams?: Promise<{
    scenario?:
      | string
      | string[];
  }>;
}) {
  const {
    projectId,
  } = await params;

  const resolvedSearchParams =
    await searchParams;

  const scenarioId =
    Array.isArray(
      resolvedSearchParams
        ?.scenario,
    )
      ? resolvedSearchParams
          ?.scenario[0]
      : resolvedSearchParams
          ?.scenario;

  const user =
    await requireUser();

  const context =
    await loadReportContext(
      user.id,
      projectId,
      scenarioId,
    );

  if (!context) {
    notFound();
  }

  if (
    !context.ready
  ) {
    return (
      <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
        <FinancialPageHeader
          eyebrow="Output"
          title="Executive report"
          description="Complete the model assumptions before generating financial reports and exports."
          scenarioName="Report"
        />

        <AnalysisSetupRequired
          projectId={
            projectId
          }
          missingSections={
            context.missingSections
          }
        />
      </div>
    );
  }

  const selectedScenarioId =
    context.selectedScenario
      ?.id;

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <FinancialPageHeader
        eyebrow="Output"
        title="Executive report"
        description="Decision-ready financial summary, annual forecast, scenario comparison and key assumptions."
        scenarioName={
          context.forecast
            .scenario.name
        }
        scenarioControl={
          <ScenarioSwitcher
            scenarios={context.project.scenarios.map(
              (
                scenario,
              ) => ({
                id:
                  scenario.id,

                name:
                  scenario.name,

                type:
                  scenario.type,
              }),
            )}
            currentScenarioId={
              selectedScenarioId ??
              ""
            }
          />
        }
      />

      <div className="flex justify-end">
        <ReportExportActions
          projectId={
            context.project.id
          }
          scenarioId={
            selectedScenarioId
          }
        />
      </div>

      <ExecutiveReport
        context={
          context
        }
      />
    </div>
  );
}
