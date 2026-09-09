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
  getOwnedProject,
} from "@/lib/projects/project-access";

import {
  markProjectAlertsRead,
  updateProjectAlertReceipt,
} from "@/lib/notifications/service";

import {
  parseAlertFingerprint,
  parseAlertKey,
  parseAlertReceiptOperation,
} from "@/lib/notifications/validation";


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


async function requireAlertProjectAccess(
  userId:
    string,
  projectId:
    string,
) {
  const project =
    await getOwnedProject(
      userId,
      projectId,
    );


  if (
    !project
  ) {
    throw new Error(
      "Project access is required to manage this alert inbox.",
    );
  }
}


export async function updateAlertReceiptAction(
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


  await requireAlertProjectAccess(
    user.id,
    projectId,
  );


  const alertKey =
    parseAlertKey(
      formString(
        formData,
        "alertKey",
      ),
    );


  const fingerprint =
    parseAlertFingerprint(
      formString(
        formData,
        "fingerprint",
      ),
    );


  const operation =
    parseAlertReceiptOperation(
      formString(
        formData,
        "operation",
      ),
    );


  await updateProjectAlertReceipt({
    projectId,

    userId:
      user.id,

    alertKey,

    fingerprint,

    operation,
  });


  revalidatePath(
    `/projects/${projectId}/alerts`,
  );


  redirect(
    `/projects/${projectId}/alerts?status=updated`,
  );
}


export async function markAllAlertsReadAction(
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


  await requireAlertProjectAccess(
    user.id,
    projectId,
  );


  const raw =
    formString(
      formData,
      "alerts",
    );


  let parsed:
    unknown;


  try {
    parsed =
      JSON.parse(
        raw,
      );
  }
  catch {
    throw new Error(
      "Alert batch is invalid.",
    );
  }


  if (
    !Array.isArray(
      parsed,
    ) ||
    parsed.length >
      100
  ) {
    throw new Error(
      "Alert batch may contain at most 100 alerts.",
    );
  }


  const alerts =
    parsed.map(
      (
        item,
      ) => {
        if (
          typeof item !==
            "object" ||
          item ===
            null ||
          Array.isArray(
            item,
          )
        ) {
          throw new Error(
            "Alert batch entry is invalid.",
          );
        }


        const record =
          item as
            Record<
              string,
              unknown
            >;


        if (
          typeof record.alertKey !==
            "string" ||
          typeof record.fingerprint !==
            "string"
        ) {
          throw new Error(
            "Alert batch entry is incomplete.",
          );
        }


        return {
          alertKey:
            parseAlertKey(
              record.alertKey,
            ),

          fingerprint:
            parseAlertFingerprint(
              record.fingerprint,
            ),
        };
      },
    );


  await markProjectAlertsRead({
    projectId,

    userId:
      user.id,

    alerts,
  });


  revalidatePath(
    `/projects/${projectId}/alerts`,
  );


  redirect(
    `/projects/${projectId}/alerts?status=all-read`,
  );
}
