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
  requireProjectWorkspaceOwner,
} from "@/lib/finance/period-close/access";

import {
  closeFinancialPeriod,
  reopenFinancialPeriod,
} from "@/lib/finance/period-close/service";

import {
  financialPeriodDate,
  parseFinancialPeriodKey,
  validateCloseConfirmation,
  validateReopenConfirmation,
} from "@/lib/finance/period-close/validation";


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


function failureMessage(
  cause:
    unknown,
): string {
  return cause instanceof Error
    ?
      cause.message.slice(
        0,
        200,
      )
    :
      "Unable to update financial-period status.";
}


function revalidateFinancialSurfaces(
  projectId:
    string,
) {
  revalidatePath(
    `/projects/${projectId}/period-close`,
  );

  revalidatePath(
    `/projects/${projectId}/actuals`,
  );

  revalidatePath(
    `/projects/${projectId}/variance-review`,
  );

  revalidatePath(
    `/projects/${projectId}/scorecard`,
  );

  revalidatePath(
    `/projects/${projectId}/board-room`,
  );
}


export async function closeFinancialPeriodAction(
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


  await requireProjectEditor(
    user.id,
    projectId,
  );


  let error:
    string |
    null =
      null;

  let periodKey =
    "";


  try {
    periodKey =
      parseFinancialPeriodKey(
        formString(
          formData,
          "periodKey",
        ),
      );


    validateCloseConfirmation({
      periodKey,

      confirmation:
        formString(
          formData,
          "confirmation",
        ),
    });


    const reason =
      formString(
        formData,
        "reason",
      );


    if (
      reason.length >
      1000
    ) {
      throw new Error(
        "Close reason cannot exceed 1000 characters.",
      );
    }


    await closeFinancialPeriod({
      projectId,

      actorUserId:
        user.id,

      periodKey,

      period:
        financialPeriodDate(
          periodKey,
        ),

      reason:
        reason ||
        null,
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


  revalidateFinancialSurfaces(
    projectId,
  );


  if (
    error
  ) {
    redirect(
      `/projects/${projectId}/period-close?status=error&message=${encodeURIComponent(
        error,
      )}`,
    );
  }


  redirect(
    `/projects/${projectId}/period-close?status=closed&period=${encodeURIComponent(
      periodKey,
    )}`,
  );
}


export async function reopenFinancialPeriodAction(
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


  await requireProjectWorkspaceOwner(
    user.id,
    projectId,
  );


  let error:
    string |
    null =
      null;

  let periodKey =
    "";


  try {
    periodKey =
      parseFinancialPeriodKey(
        formString(
          formData,
          "periodKey",
        ),
      );


    validateReopenConfirmation({
      periodKey,

      confirmation:
        formString(
          formData,
          "confirmation",
        ),
    });


    const reason =
      formString(
        formData,
        "reason",
      );


    if (
      reason.length <
        5 ||
      reason.length >
        1000
    ) {
      throw new Error(
        "Reopen reason must contain between 5 and 1000 characters.",
      );
    }


    await reopenFinancialPeriod({
      projectId,

      actorUserId:
        user.id,

      periodKey,

      period:
        financialPeriodDate(
          periodKey,
        ),

      reason,
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


  revalidateFinancialSurfaces(
    projectId,
  );


  if (
    error
  ) {
    redirect(
      `/projects/${projectId}/period-close?status=error&message=${encodeURIComponent(
        error,
      )}`,
    );
  }


  redirect(
    `/projects/${projectId}/period-close?status=reopened&period=${encodeURIComponent(
      periodKey,
    )}`,
  );
}
