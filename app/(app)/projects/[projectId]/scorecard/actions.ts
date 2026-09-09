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
  parseKpiMetricCode,
  parseKpiTargetPeriod,
  parseKpiTargetValue,
} from "@/lib/finance/scorecard/metrics";

import {
  deleteProjectKpiTarget,
  saveProjectKpiTarget,
} from "@/lib/finance/scorecard/service";


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


function failure(
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
      "Unable to update KPI targets.";
}


export async function saveKpiTargetAction(
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
    const metricCode =
      parseKpiMetricCode(
        formString(
          formData,
          "metricCode",
        ),
      );


    const periodKey =
      parseKpiTargetPeriod(
        formString(
          formData,
          "periodKey",
        ),
      );


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
        "KPI owner cannot exceed 80 characters.",
      );
    }


    const note =
      formString(
        formData,
        "note",
      );


    if (
      note.length >
      1000
    ) {
      throw new Error(
        "KPI target note cannot exceed 1000 characters.",
      );
    }


    await saveProjectKpiTarget({
      projectId,

      actorUserId:
        user.id,

      periodKey,

      metricCode,

      targetValue:
        parseKpiTargetValue(
          metricCode,
          formString(
            formData,
            "targetValue",
          ),
        ),

      ownerName:
        nullableString(
          ownerName,
        ),

      note:
        nullableString(
          note,
        ),
    });
  }
  catch (
    cause
  ) {
    error =
      failure(
        cause,
      );
  }


  revalidatePath(
    `/projects/${projectId}/scorecard`,
  );


  if (
    error
  ) {
    redirect(
      `/projects/${projectId}/scorecard?status=error&message=${encodeURIComponent(
        error,
      )}`,
    );
  }


  redirect(
    `/projects/${projectId}/scorecard?status=saved`,
  );
}


export async function deleteKpiTargetAction(
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
    const targetId =
      formString(
        formData,
        "targetId",
      );


    if (
      !targetId
    ) {
      throw new Error(
        "KPI target ID is required.",
      );
    }


    await deleteProjectKpiTarget({
      projectId,

      actorUserId:
        user.id,

      targetId,
    });
  }
  catch (
    cause
  ) {
    error =
      failure(
        cause,
      );
  }


  revalidatePath(
    `/projects/${projectId}/scorecard`,
  );


  if (
    error
  ) {
    redirect(
      `/projects/${projectId}/scorecard?status=error&message=${encodeURIComponent(
        error,
      )}`,
    );
  }


  redirect(
    `/projects/${projectId}/scorecard?status=deleted`,
  );
}
