import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import {
  ScenarioComparisonWorkspace,
} from "@/components/scenario-comparison/scenario-comparison-workspace";

import {
  requireCurrentUserIdentity,
} from "@/lib/auth/current-user";

import {
  getOwnedProject,
} from "@/lib/projects/project-access";

import {
  normalizeScenarioCollection,
} from "@/lib/projects/scenario-comparison/normalize";


export const metadata: Metadata = {
  title:
    "Scenario Comparison",

  robots: {
    index:
      false,

    follow:
      false,
  },
};


export default async function ScenarioComparisonPage({
  params,
}: {
  params:
    Promise<{
      projectId:
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


  const scenarios =
    normalizeScenarioCollection(
      project as unknown,
    );


  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <header>
        <p className="text-sm font-medium text-muted-foreground">
          Scenario intelligence
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Scenario Comparison Center
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Compare Base, Bull, Bear, and custom scenario configurations, identify exactly which drivers differ, and quantify how far each alternative diverges from the selected reference scenario.
        </p>
      </header>

      <ScenarioComparisonWorkspace
        projectId={
          projectId
        }
        scenarios={
          scenarios
        }
      />
    </main>
  );
}
