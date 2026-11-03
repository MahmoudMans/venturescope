import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import {
  RiskCenterWorkspace,
} from "@/components/risk-center/risk-center-workspace";

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
    "Liquidity Risk Center",

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


export default async function RiskCenterPage({
  params,
  searchParams,
}: {
  params:
    Promise<{
      projectId:
        string;
    }>;

  searchParams:
    Promise<{
      status?:
        string;

      message?:
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
    status,
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

      searchParams,
    ]);


  const policy =
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
          Liquidity Risk Center
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Track cash guardrails, runway, monthly burn, EBITDA resilience, and downside liquidity before financial risks become operational emergencies.
        </p>
      </header>

      {
        status.status
          ?
            (
              <div
                role={
                  status.status ===
                    "error"
                    ?
                      "alert"
                    :
                      "status"
                }
                className="rounded-xl border bg-muted/30 px-4 py-3 text-sm"
              >
                {
                  status.status ===
                    "saved"
                    ?
                      "Financial guardrails saved successfully."
                    :
                      status.message ??
                      "The guardrail update could not be completed."
                }
              </div>
            )
          :
            null
      }

      <RiskCenterWorkspace
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
        policy={
          policy
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
