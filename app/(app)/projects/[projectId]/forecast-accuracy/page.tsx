import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import {
  ForecastAccuracyWorkspace,
} from "@/components/forecast-accuracy/forecast-accuracy-workspace";

import {
  requireCurrentUserIdentity,
} from "@/lib/auth/current-user";

import {
  prisma,
} from "@/lib/db/prisma";

import {
  getOwnedProject,
} from "@/lib/projects/project-access";


export const metadata: Metadata = {
  title:
    "Forecast Accuracy",

  robots: {
    index:
      false,

    follow:
      false,
  },
};


function decimalNumber(
  value:
    {
      toString():
        string;
    } |
    null,
): number |
  null {
  return value ===
    null
    ?
      null
    :
      Number(
        value.toString(),
      );
}


export default async function ForecastAccuracyPage({
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


  const storedActuals =
    await prisma.actualPeriod.findMany({
      where: {
        projectId,
      },

      orderBy: {
        period:
          "asc",
      },
  });


  const actuals =
    storedActuals.map(
      (
        row,
      ) => ({
        period:
          `${row.period
            .getUTCFullYear()
            .toString()
            .padStart(
              4,
              "0",
            )}-${(
            row.period.getUTCMonth() +
            1
          )
            .toString()
            .padStart(
              2,
              "0",
            )}`,

        revenue:
          decimalNumber(
            row.revenue,
          ),

        cogs:
          decimalNumber(
            row.cogs,
          ),

        operatingExpenses:
          decimalNumber(
            row.operatingExpenses,
          ),

        ebitda:
          decimalNumber(
            row.ebitda,
          ),

        netIncome:
          decimalNumber(
            row.netIncome,
          ),

        cashFlow:
          decimalNumber(
            row.cashFlow,
          ),

        cashBalance:
          decimalNumber(
            row.cashBalance,
          ),

        mrr:
          decimalNumber(
            row.mrr,
          ),

        customers:
          row.customers,
      }),
    );


  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <header>
        <p className="text-sm font-medium text-muted-foreground">
          Planning quality
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Forecast accuracy
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Measure how closely the VentureScope plan has tracked observed performance, identify systematic forecasting bias, and detect whether forecasting reliability is improving or deteriorating.
        </p>
      </header>

      <ForecastAccuracyWorkspace
        projectId={
          projectId
        }
        currency={
          project.currency
        }
        actuals={
          actuals
        }
      />
    </main>
  );
}
