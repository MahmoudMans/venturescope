import type {
  Metadata,
} from "next";
import {
  BarChart3,
  Gauge,
} from "lucide-react";

import {
  AnalysisSetupRequired,
} from "@/components/financial/analysis-setup-required";
import {
  FinancialPageHeader,
} from "@/components/financial/financial-page-header";
import {
  ScenarioComparisonChart,
} from "@/components/scenarios/scenario-comparison-chart";
import {
  ScenarioComparisonTable,
} from "@/components/scenarios/scenario-comparison-table";
import {
  LiveScenarioSimulator,
} from "@/components/scenarios/live-scenario-simulator";
import {
  ScenarioManager,
} from "@/components/scenarios/scenario-manager";
import {
  Badge,
} from "@/components/ui/badge";
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
  getFinancialAnalysis,
} from "@/lib/finance/analysis-context";
import {
  generateScenarioComparison,
} from "@/lib/finance/comparison";
import {
  buildFinancialModelInput,
  mapPersistedScenario,
} from "@/lib/finance/project-input";
import {
  serializeScenarioForManagement,
} from "@/lib/scenarios/modifiers";

export const metadata: Metadata = {
  title:
    "Scenario analysis",
};

export default async function ScenariosPage({
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

  const analysis =
    await getFinancialAnalysis(
      user.id,
      projectId,
    );

  const project =
    analysis.project;

  const scenarioViews =
    project.scenarios.map(
      (
        scenario,
      ) =>
        serializeScenarioForManagement(
          scenario,
          project.revenueMode,
        ),
    );

  return (
    <div className="mx-auto max-w-[1600px] space-y-10 px-5 py-8 lg:px-8 lg:py-10">
      <FinancialPageHeader
        title="Scenario analysis"
        description="Stress-test the financial model with Base, Bull, Bear and custom operating scenarios."
        scenarioName={`${project.scenarios.length} scenarios`}
      />

      <section className="space-y-5">
        <ScenarioManager
          projectId={
            project.id
          }
          revenueMode={
            project.revenueMode
          }
          scenarios={
            scenarioViews
          }
        />
      </section>

      {!analysis.ready ? (
        <section>
          <AnalysisSetupRequired
            projectId={
              project.id
            }
            missingSections={
              analysis.missingSections
            }
          />
        </section>
      ) : (
        <ScenarioAnalysisContent
          analysis={
            analysis
          }
        />
      )}
    </div>
  );
}

function ScenarioAnalysisContent({
  analysis,
}: {
  analysis:
    Awaited<
      ReturnType<
        typeof getFinancialAnalysis
      >
    > & {
      ready: true;
    };
}) {
  const project =
    analysis.project;

  const baseInput =
    buildFinancialModelInput(
      project,
      analysis.baseScenario,
    );

  const scenarioInputs =
    project.scenarios.map(
      (
        scenario,
      ) =>
        mapPersistedScenario(
          scenario,
        ),
    );

  const comparison =
    generateScenarioComparison(
      baseInput,
      scenarioInputs,
    );

  return (
    <>
      <section className="space-y-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">
              Scenario comparison
            </h3>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              Every scenario runs independently through the same deterministic financial engine.
            </p>
          </div>

          <Badge variant="outline">
            {
              comparison.length
            }{" "}
            models calculated
          </Badge>
        </div>

        <Card className="border-border/70">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>
                  Financial outcomes
                </CardTitle>

                <CardDescription className="mt-1">
                  First-year revenue, first-year EBITDA and ending cash by scenario.
                </CardDescription>
              </div>

              <BarChart3
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
          </CardHeader>

          <CardContent>
            <ScenarioComparisonChart
              comparison={
                comparison
              }
              currency={
                project.currency
              }
            />
          </CardContent>
        </Card>

        <ScenarioComparisonTable
          projectId={
            project.id
          }
          comparison={
            comparison
          }
          currency={
            project.currency
          }
        />
      </section>

      <section className="rounded-2xl border bg-muted/10 p-5 sm:p-7">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-foreground text-background">
            <Gauge
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <div>
            <div className="font-semibold">
              Simulation Lab
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              Browser-side preview powered by the same VentureScope finance engine.
            </p>
          </div>
        </div>

        <LiveScenarioSimulator
          baseInput={
            baseInput
          }
        />
      </section>
    </>
  );
}
