"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  redirect,
} from "next/navigation";

import {
  requireCurrentUserIdentity,
} from "@/lib/auth/current-user";

import {
  requireProjectEditor,
} from "@/lib/projects/project-access";

import {
  prisma,
} from "@/lib/db/prisma";

import {
  normalizeForecastCsv,
} from "@/lib/finance/analytics/csv";

import {
  DEFAULT_PROJECT_RISK_POLICY,
} from "@/lib/finance/risk-center/policy";

import {
  buildExecutiveReviewSnapshot,
} from "@/lib/finance/board-room/snapshot";

import {
  parseExecutiveReviewPeriod,
} from "@/lib/finance/board-room/validation";

import {
  createExecutiveReview,
} from "@/lib/finance/board-room/service";


const MAX_FORECAST_CSV_BYTES =
  512 *
  1024;


function formString(
  formData:
    FormData,
  name:
    string,
): string {
  const value =
    formData.get(
      name,
    );


  return typeof value ===
    "string"
    ?
      value.trim()
    :
      "";
}


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


function failureMessage(
  cause:
    unknown,
): string {
  return cause instanceof Error
    ?
      cause.message.slice(
        0,
        180,
      )
    :
      "Unable to freeze executive review.";
}


export async function createExecutiveReviewAction(
  formData:
    FormData,
): Promise<void> {
  const user =
    await requireCurrentUserIdentity();


  const projectId =
    formString(
      formData,
      "projectId",
    );


  const project =
    await requireProjectEditor(
      user.id,
      projectId,
    );


  let error:
    string |
    null =
      null;

  let createdPeriod =
    "";


  try {
    const title =
      formString(
        formData,
        "title",
      );


    if (
      title.length <
        3 ||
      title.length >
        120
    ) {
      throw new Error(
        "Review title must contain between 3 and 120 characters.",
      );
    }


    const commentary =
      formString(
        formData,
        "commentary",
      );


    if (
      commentary.length >
      4000
    ) {
      throw new Error(
        "Management commentary cannot exceed 4000 characters.",
      );
    }


    createdPeriod =
      parseExecutiveReviewPeriod(
        formString(
          formData,
          "periodKey",
        ),
      );


    const forecastCsv =
      formString(
        formData,
        "forecastCsv",
      );


    if (
      !forecastCsv
    ) {
      throw new Error(
        "Current forecast data is unavailable.",
      );
    }


    if (
      Buffer.byteLength(
        forecastCsv,
        "utf8",
      ) >
      MAX_FORECAST_CSV_BYTES
    ) {
      throw new Error(
        "Forecast snapshot exceeds the 512 KB safety limit.",
      );
    }


    const forecasts =
      normalizeForecastCsv(
        forecastCsv,
      );


    if (
      forecasts.length ===
      0
    ) {
      throw new Error(
        "Current forecast contains no usable periods.",
      );
    }


    const [
      storedActuals,
      storedPolicy,
      storedActions,
    ] =
      await Promise.all([
        prisma.actualPeriod.findMany({
          where: {
            projectId,
          },

          orderBy: {
            period:
              "asc",
          },
        }),

        prisma.projectRiskPolicy.findUnique({
          where: {
            projectId,
          },
        }),

        prisma.decisionAction.findMany({
          where: {
            projectId,
          },

          select: {
            status:
              true,

            priority:
              true,

            dueDate:
              true,
          },
        }),
      ]);


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


    const latestActual =
      actuals[
        actuals.length -
        1
      ] ??
      null;


    const capturedAt =
      new Date()
        .toISOString();


    const snapshot =
      buildExecutiveReviewSnapshot({
        capturedAt,

        actuals,

        forecasts,

        riskPolicy,

        latestActualPeriod:
          latestActual?.period ??
          null,

        latestActualCash:
          latestActual?.cashBalance ??
          null,

        actions:
          storedActions.map(
            (
              action,
            ) => ({
              status:
                action.status,

              priority:
                action.priority,

              dueDate:
                action.dueDate
                  ?.toISOString() ??
                null,
            }),
          ),
      });


    await createExecutiveReview({
      projectId,

      actorUserId:
        user.id,

      periodKey:
        createdPeriod,

      title,

      commentary:
        commentary
          ?
            commentary
          :
            null,

      modelVersion:
        project.modelVersion,

      snapshot,
    });
  }
  catch (
    cause
  ) {
    error =
      failureMessage(
        cause,
      );
  }


  revalidatePath(
    `/projects/${projectId}/board-room`,
  );


  if (
    error
  ) {
    redirect(
      `/projects/${projectId}/board-room?status=error&message=${encodeURIComponent(
        error,
      )}`,
    );
  }


  redirect(
    `/projects/${projectId}/board-room?status=created&period=${encodeURIComponent(
      createdPeriod,
    )}`,
  );
}
