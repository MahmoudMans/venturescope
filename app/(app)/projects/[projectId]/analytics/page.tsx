import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import {
  AdvancedFinancialAnalytics,
} from "@/components/analytics/advanced-financial-analytics";

import {
  requireCurrentUserIdentity,
} from "@/lib/auth/current-user";

import {
  getOwnedProject,
} from "@/lib/projects/project-access";


export const metadata: Metadata = {
  title:
    "Advanced Analytics",

  robots: {
    index:
      false,

    follow:
      false,
  },
};


export default async function AdvancedAnalyticsPage({
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


  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <header>
        <p className="text-sm font-medium text-muted-foreground">
          Decision intelligence
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Advanced analytics
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Evaluate valuation, operating efficiency, unit economics, cash-generation quality, and DCF sensitivity using the current VentureScope forecast.
        </p>
      </header>

      <AdvancedFinancialAnalytics
        projectId={
          project.id
        }
        projectName={
          project.name
        }
        currency={
          project.currency
        }
      />
    </main>
  );
}
