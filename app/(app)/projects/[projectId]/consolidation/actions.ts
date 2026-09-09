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
  prisma,
} from "@/lib/db/prisma";

import {
  requireProjectWorkspaceOwner,
} from "@/lib/finance/period-close/access";

import {
  deleteWorkspaceFxRate,
  saveConsolidationSettings,
  saveWorkspaceFxRate,
} from "@/lib/finance/consolidation/service";

import {
  assertDistinctCurrencyPair,
  parseFxDate,
  parseFxRate,
  parseFxSourceLabel,
  parseVentureScopeCurrency,
} from "@/lib/finance/consolidation/validation";


function value(
  formData:
    FormData,
  key:
    string,
): string {
  const raw =
    formData.get(
      key,
    );


  return typeof raw ===
    "string"
    ?
      raw.trim()
    :
      "";
}


async function workspaceContext(
  userId:
    string,
  projectId:
    string,
) {
  await requireProjectWorkspaceOwner(
    userId,
    projectId,
  );


  const workspaceProject =
    await prisma.project.findUnique({
      where: {
        id:
          projectId,
      },

      select: {
        workspaceId:
          true,
      },
    });


  if (
    !workspaceProject?.workspaceId
  ) {
    throw new Error(
      "Project workspace is unavailable.",
    );
  }


  return {
    workspaceId:
      workspaceProject.workspaceId,
  };
}


function refresh(
  projectId:
    string,
) {
  revalidatePath(
    `/projects/${projectId}/consolidation`,
  );

  revalidatePath(
    `/projects/${projectId}/activity`,
  );
}


export async function saveConsolidationSettingsAction(
  formData:
    FormData,
): Promise<void> {
  const user =
    await requireCurrentUserIdentity();


  const projectId =
    value(
      formData,
      "projectId",
    );


  const context =
    await workspaceContext(
      user.id,
      projectId,
    );


  await saveConsolidationSettings({
    projectId,

    workspaceId:
      context.workspaceId,

    actorUserId:
      user.id,

    reportingCurrency:
      parseVentureScopeCurrency(
        value(
          formData,
          "reportingCurrency",
        ),
      ),
  });


  refresh(
    projectId,
  );


  redirect(
    `/projects/${projectId}/consolidation?status=settings-saved`,
  );
}


export async function saveWorkspaceFxRateAction(
  formData:
    FormData,
): Promise<void> {
  const user =
    await requireCurrentUserIdentity();


  const projectId =
    value(
      formData,
      "projectId",
    );


  const context =
    await workspaceContext(
      user.id,
      projectId,
    );


  const baseCurrency =
    parseVentureScopeCurrency(
      value(
        formData,
        "baseCurrency",
      ),
    );


  const quoteCurrency =
    parseVentureScopeCurrency(
      value(
        formData,
        "quoteCurrency",
      ),
    );


  assertDistinctCurrencyPair({
    baseCurrency,

    quoteCurrency,
  });


  const effectiveDate =
    parseFxDate(
      value(
        formData,
        "effectiveDate",
      ),
    );


  await saveWorkspaceFxRate({
    projectId,

    workspaceId:
      context.workspaceId,

    actorUserId:
      user.id,

    baseCurrency,

    quoteCurrency,

    rate:
      parseFxRate(
        value(
          formData,
          "rate",
        ),
      ),

    effectiveDate:
      new Date(
        `${effectiveDate}T00:00:00.000Z`,
      ),

    sourceLabel:
      parseFxSourceLabel(
        value(
          formData,
          "sourceLabel",
        ),
      ),
  });


  refresh(
    projectId,
  );


  redirect(
    `/projects/${projectId}/consolidation?status=rate-saved`,
  );
}


export async function deleteWorkspaceFxRateAction(
  formData:
    FormData,
): Promise<void> {
  const user =
    await requireCurrentUserIdentity();


  const projectId =
    value(
      formData,
      "projectId",
    );


  const context =
    await workspaceContext(
      user.id,
      projectId,
    );


  const rateId =
    value(
      formData,
      "rateId",
    );


  if (
    !rateId
  ) {
    throw new Error(
      "FX rate ID is required.",
    );
  }


  await deleteWorkspaceFxRate({
    projectId,

    workspaceId:
      context.workspaceId,

    actorUserId:
      user.id,

    rateId,
  });


  refresh(
    projectId,
  );


  redirect(
    `/projects/${projectId}/consolidation?status=rate-deleted`,
  );
}
