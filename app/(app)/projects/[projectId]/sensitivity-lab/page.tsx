import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import {
  SensitivityLabWorkspace,
} from "@/components/sensitivity-lab/sensitivity-lab-workspace";

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
} from "@/lib/projects/project-access";


export const metadata: Metadata = {
  title:
    "Sensitivity Lab",

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


export default async function SensitivityLabPage({
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
    storedPolicy,
    latestActual,
  ] =
    await Promise.all([
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
          Financial resilience
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Financial Sensitivity Lab
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Explore how combinations of revenue downside and cost inflation affect liquidity, cash exhaustion, and the capital required to protect the management cash floor.
        </p>
      </header>

      <SensitivityLabWorkspace
        projectId={
          projectId
        }
        currency={
          project.currency
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
