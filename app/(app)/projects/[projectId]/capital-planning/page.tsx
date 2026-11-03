import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import {
  CapitalPlanningWorkspace,
} from "@/components/capital-planning/capital-planning-workspace";

import {
  requireCurrentUserIdentity,
} from "@/lib/auth/current-user";

import {
  prisma,
} from "@/lib/db/prisma";

import {
  DEFAULT_PROJECT_RISK_POLICY,
} from "@/lib/finance/risk-center/policy";

import {
  getOwnedProject,
  getProjectForEditor,
} from "@/lib/projects/project-access";


export const metadata: Metadata = {
  title:
    "Capital Planning",

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


export default async function CapitalPlanningPage({
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


  const [
    editableProject,
    storedPolicy,
    latestActual,
  ] =
    await Promise.all([
      getProjectForEditor(
        user.id,
        projectId,
      ),

      prisma.projectRiskPolicy.findUnique({
        where: {
          projectId,
        },
      }),

      prisma.actualPeriod.findFirst({
        where: {
          projectId,
        },

        orderBy: {
          period:
            "desc",
        },

        select: {
          period:
            true,

          cashBalance:
            true,
        },
      }),
    ]);


  const riskPolicy =
    storedPolicy
      ?
        {
          minimumCash:
            decimalNumber(
              storedPolicy.minimumCash,
            ),

          minimumRunwayMonths:
            storedPolicy.minimumRunwayMonths,

          minimumEbitdaMargin:
            decimalNumber(
              storedPolicy.minimumEbitdaMargin,
            ),

          maximumMonthlyBurn:
            decimalNumber(
              storedPolicy.maximumMonthlyBurn,
            ),

          downsideRevenueShock:
            Number(
              storedPolicy
                .downsideRevenueShock
                .toString(),
            ),

          downsideCostInflation:
            Number(
              storedPolicy
                .downsideCostInflation
                .toString(),
            ),
        }
      :
        DEFAULT_PROJECT_RISK_POLICY;


  const latestActualPeriod =
    latestActual
      ?
        `${latestActual.period
          .getUTCFullYear()
          .toString()
          .padStart(
            4,
            "0",
          )}-${(
          latestActual.period.getUTCMonth() +
          1
        )
          .toString()
          .padStart(
            2,
            "0",
          )}`
      :
        null;


  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <header>
        <p className="text-sm font-medium text-muted-foreground">
          Capital allocation
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Funding Strategy &amp; Capital Planning
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Quantify the funding gap needed to protect liquidity and compare the modeled cash, dilution, and debt-service consequences of equity, debt, and hybrid capital structures.
        </p>
      </header>

      <CapitalPlanningWorkspace
        projectId={
          projectId
        }
        currency={
          project.currency
        }
        editable={
          Boolean(
            editableProject,
          )
        }
        riskPolicy={
          riskPolicy
        }
        latestActualPeriod={
          latestActualPeriod
        }
        latestActualCash={
          decimalNumber(
            latestActual?.cashBalance ??
            null,
          )
        }
      />
    </div>
  );
}
