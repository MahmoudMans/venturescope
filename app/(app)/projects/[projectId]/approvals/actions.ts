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
  requireProjectEditor,
} from "@/lib/projects/project-access";

import {
  requireProjectWorkspaceOwner,
} from "@/lib/finance/period-close/access";

import {
  cancelApprovalRequest,
  createApprovalRequest,
  decideApprovalRequest,
} from "@/lib/approvals/service";

import {
  parseApprovalDecision,
  parseApprovalRequestType,
  parseApprovalSubjectValue,
} from "@/lib/approvals/validation";


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
        220,
      )
    :
      "Approval workflow operation failed.";
}


function revalidateApprovalSurfaces(
  projectId:
    string,
) {
  revalidatePath(
    `/projects/${projectId}/approvals`,
  );

  revalidatePath(
    `/projects/${projectId}/activity`,
  );
}


export async function createApprovalRequestAction(
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
        5 ||
      title.length >
        160
    ) {
      throw new Error(
        "Approval title must contain between 5 and 160 characters.",
      );
    }


    const description =
      formString(
        formData,
        "description",
      );


    if (
      description.length >
      3000
    ) {
      throw new Error(
        "Approval description cannot exceed 3000 characters.",
      );
    }


    await createApprovalRequest({
      projectId,

      actorUserId:
        user.id,

      requestType:
        parseApprovalRequestType(
          formString(
            formData,
            "requestType",
          ),
        ),

      subjectType:
        parseApprovalSubjectValue(
          formString(
            formData,
            "subjectType",
          ),
          "Subject type",
        ),

      subjectId:
        parseApprovalSubjectValue(
          formString(
            formData,
            "subjectId",
          ),
          "Subject ID",
        ),

      title,

      description:
        nullableString(
          description,
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


  revalidateApprovalSurfaces(
    projectId,
  );


  if (
    error
  ) {
    redirect(
      `/projects/${projectId}/approvals?status=error&message=${encodeURIComponent(
        error,
      )}`,
    );
  }


  redirect(
    `/projects/${projectId}/approvals?status=requested`,
  );
}


export async function decideApprovalRequestAction(
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


  try {
    const requestId =
      formString(
        formData,
        "requestId",
      );


    if (
      !requestId
    ) {
      throw new Error(
        "Approval request ID is required.",
      );
    }


    const decisionNote =
      formString(
        formData,
        "decisionNote",
      );


    if (
      decisionNote.length <
        5 ||
      decisionNote.length >
        2000
    ) {
      throw new Error(
        "Decision rationale must contain between 5 and 2000 characters.",
      );
    }


    await decideApprovalRequest({
      projectId,

      requestId,

      actorUserId:
        user.id,

      decision:
        parseApprovalDecision(
          formString(
            formData,
            "decision",
          ),
        ),

      decisionNote,
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


  revalidateApprovalSurfaces(
    projectId,
  );


  if (
    error
  ) {
    redirect(
      `/projects/${projectId}/approvals?status=error&message=${encodeURIComponent(
        error,
      )}`,
    );
  }


  redirect(
    `/projects/${projectId}/approvals?status=decided`,
  );
}


export async function cancelApprovalRequestAction(
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
    await getOwnedProject(
      user.id,
      projectId,
    );


  if (
    !project
  ) {
    throw new Error(
      "Project access is required.",
    );
  }


  let error:
    string |
    null =
      null;


  try {
    const requestId =
      formString(
        formData,
        "requestId",
      );


    if (
      !requestId
    ) {
      throw new Error(
        "Approval request ID is required.",
      );
    }


    await cancelApprovalRequest({
      projectId,

      requestId,

      actorUserId:
        user.id,
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


  revalidateApprovalSurfaces(
    projectId,
  );


  if (
    error
  ) {
    redirect(
      `/projects/${projectId}/approvals?status=error&message=${encodeURIComponent(
        error,
      )}`,
    );
  }


  redirect(
    `/projects/${projectId}/approvals?status=cancelled`,
  );
}
