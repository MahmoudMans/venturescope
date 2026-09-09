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
  parseRecoveryPeriod,
  parseVarianceCauseCode,
  parseVarianceCommentaryStatus,
  parseVarianceMetricCode,
  parseVarianceNature,
  parseVariancePeriod,
} from "@/lib/finance/variance-review/metrics";

import {
  deleteVarianceCommentary,
  saveVarianceCommentary,
} from "@/lib/finance/variance-review/service";


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


function nullableString(
  value:
    string,
): string |
  null {
  return value
    ?
      value
    :
      null;
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
      "Unable to update variance commentary.";
}


export async function saveVarianceCommentaryAction(
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


  try {
    const explanation =
      formString(
        formData,
        "explanation",
      );


    if (
      explanation.length <
        5 ||
      explanation.length >
        2000
    ) {
      throw new Error(
        "Management explanation must contain between 5 and 2000 characters.",
      );
    }


    const correctiveAction =
      formString(
        formData,
        "correctiveAction",
      );


    if (
      correctiveAction.length >
      2000
    ) {
      throw new Error(
        "Corrective action cannot exceed 2000 characters.",
      );
    }


    const ownerName =
      formString(
        formData,
        "ownerName",
      );


    if (
      ownerName.length >
      80
    ) {
      throw new Error(
        "Variance owner cannot exceed 80 characters.",
      );
    }


    await saveVarianceCommentary({
      projectId,

      actorUserId:
        user.id,

      periodKey:
        parseVariancePeriod(
          formString(
            formData,
            "periodKey",
          ),
        ),

      metricCode:
        parseVarianceMetricCode(
          formString(
            formData,
            "metricCode",
          ),
        ),

      causeCode:
        parseVarianceCauseCode(
          formString(
            formData,
            "causeCode",
          ),
        ),

      varianceNature:
        parseVarianceNature(
          formString(
            formData,
            "varianceNature",
          ),
        ),

      explanation,

      correctiveAction:
        nullableString(
          correctiveAction,
        ),

      ownerName:
        nullableString(
          ownerName,
        ),

      recoveryPeriodKey:
        parseRecoveryPeriod(
          formString(
            formData,
            "recoveryPeriodKey",
          ),
        ),

      status:
        parseVarianceCommentaryStatus(
          formString(
            formData,
            "status",
          ),
        ),
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
    `/projects/${projectId}/variance-review`,
  );


  if (
    error
  ) {
    redirect(
      `/projects/${projectId}/variance-review?status=error&message=${encodeURIComponent(
        error,
      )}`,
    );
  }


  redirect(
    `/projects/${projectId}/variance-review?status=saved`,
  );
}


export async function deleteVarianceCommentaryAction(
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


  try {
    const commentaryId =
      formString(
        formData,
        "commentaryId",
      );


    if (
      !commentaryId
    ) {
      throw new Error(
        "Variance commentary ID is required.",
      );
    }


    await deleteVarianceCommentary({
      projectId,

      actorUserId:
        user.id,

      commentaryId,
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
    `/projects/${projectId}/variance-review`,
  );


  if (
    error
  ) {
    redirect(
      `/projects/${projectId}/variance-review?status=error&message=${encodeURIComponent(
        error,
      )}`,
    );
  }


  redirect(
    `/projects/${projectId}/variance-review?status=deleted`,
  );
}
