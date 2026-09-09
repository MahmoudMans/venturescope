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
  createDecisionAction,
  updateDecisionActionStatus,
} from "@/lib/finance/decision-center/service";

import {
  parseDecisionDueDate,
  parseDecisionPriority,
  parseDecisionSourceCode,
  parseDecisionStatus,
} from "@/lib/finance/decision-center/validation";


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


function actionError(
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
      "Unable to update the management action register.";
}


export async function createDecisionActionAction(
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
        "Action title must contain between 3 and 120 characters.",
      );
    }


    const details =
      formString(
        formData,
        "details",
      );


    if (
      details.length >
      1000
    ) {
      throw new Error(
        "Action details cannot exceed 1000 characters.",
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
        "Action owner cannot exceed 80 characters.",
      );
    }


    await createDecisionAction({
      projectId,

      actorUserId:
        user.id,

      title,

      details:
        nullableString(
          details,
        ),

      sourceCode:
        parseDecisionSourceCode(
          formString(
            formData,
            "sourceCode",
          ),
        ),

      priority:
        parseDecisionPriority(
          formString(
            formData,
            "priority",
          ),
        ),

      ownerName:
        nullableString(
          ownerName,
        ),

      dueDate:
        parseDecisionDueDate(
          formString(
            formData,
            "dueDate",
          ),
        ),
    });
  }
  catch (
    cause
  ) {
    error =
      actionError(
        cause,
      );
  }


  revalidatePath(
    `/projects/${projectId}/decision-center`,
  );


  if (
    error
  ) {
    redirect(
      `/projects/${projectId}/decision-center?status=error&message=${encodeURIComponent(
        error,
      )}`,
    );
  }


  redirect(
    `/projects/${projectId}/decision-center?status=created`,
  );
}


export async function updateDecisionActionStatusAction(
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
    const actionId =
      formString(
        formData,
        "actionId",
      );


    if (
      !actionId
    ) {
      throw new Error(
        "Management action ID is required.",
      );
    }


    await updateDecisionActionStatus({
      projectId,

      actionId,

      actorUserId:
        user.id,

      status:
        parseDecisionStatus(
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
      actionError(
        cause,
      );
  }


  revalidatePath(
    `/projects/${projectId}/decision-center`,
  );


  if (
    error
  ) {
    redirect(
      `/projects/${projectId}/decision-center?status=error&message=${encodeURIComponent(
        error,
      )}`,
    );
  }


  redirect(
    `/projects/${projectId}/decision-center?status=updated`,
  );
}
