import {
  prisma,
} from "@/lib/db/prisma";

import {
  logStructured,
} from "@/lib/observability/logger";

import type {
  ProjectRiskPolicy,
} from "@/lib/finance/risk-center/types";


export async function saveProjectRiskPolicy({
  projectId,
  actorUserId,
  policy,
}: {
  projectId:
    string;

  actorUserId:
    string;

  policy:
    ProjectRiskPolicy;
}) {
  const saved =
    await prisma.projectRiskPolicy.upsert({
      where: {
        projectId,
      },

      create: {
        projectId,

        minimumCash:
          policy.minimumCash,

        minimumRunwayMonths:
          policy.minimumRunwayMonths,

        minimumEbitdaMargin:
          policy.minimumEbitdaMargin,

        maximumMonthlyBurn:
          policy.maximumMonthlyBurn,

        downsideRevenueShock:
          policy.downsideRevenueShock,

        downsideCostInflation:
          policy.downsideCostInflation,
      },

      update: {
        minimumCash:
          policy.minimumCash,

        minimumRunwayMonths:
          policy.minimumRunwayMonths,

        minimumEbitdaMargin:
          policy.minimumEbitdaMargin,

        maximumMonthlyBurn:
          policy.maximumMonthlyBurn,

        downsideRevenueShock:
          policy.downsideRevenueShock,

        downsideCostInflation:
          policy.downsideCostInflation,
      },

      select: {
        id:
          true,

        updatedAt:
          true,
      },
    });


  logStructured(
    "info",
    "project.risk-policy.updated",
    {
      projectId,

      actorUserId,

      riskPolicyId:
        saved.id,
    },
  );


  return saved;
}
