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
  parseProjectRiskPolicy,
} from "@/lib/finance/risk-center/policy";

import {
  saveProjectRiskPolicy,
} from "@/lib/finance/risk-center/service";


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


export async function saveRiskPolicyAction(
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
    const policy =
      parseProjectRiskPolicy({
        minimumCash:
          formString(
            formData,
            "minimumCash",
          ),

        minimumRunwayMonths:
          formString(
            formData,
            "minimumRunwayMonths",
          ),

        minimumEbitdaMarginPercent:
          formString(
            formData,
            "minimumEbitdaMarginPercent",
          ),

        maximumMonthlyBurn:
          formString(
            formData,
            "maximumMonthlyBurn",
          ),

        downsideRevenueShockPercent:
          formString(
            formData,
            "downsideRevenueShockPercent",
          ),

        downsideCostInflationPercent:
          formString(
            formData,
            "downsideCostInflationPercent",
          ),
      });


    await saveProjectRiskPolicy({
      projectId,

      actorUserId:
        user.id,

      policy,
    });
  }
  catch (
    cause
  ) {
    error =
      cause instanceof Error
        ?
          cause.message.slice(
            0,
            180,
          )
        :
          "Unable to save financial guardrails.";
  }


  revalidatePath(
    `/projects/${projectId}/risk-center`,
  );


  if (
    error
  ) {
    redirect(
      `/projects/${projectId}/risk-center?status=error&message=${encodeURIComponent(
        error,
      )}`,
    );
  }


  redirect(
    `/projects/${projectId}/risk-center?status=saved`,
  );
}
