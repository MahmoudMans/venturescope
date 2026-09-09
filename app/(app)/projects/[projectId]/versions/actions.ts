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
  createProjectRevision,
  restoreProjectRevision,
} from "@/lib/projects/versioning/service";


function value(
  formData:
    FormData,
  key:
    string,
): string {
  const candidate =
    formData.get(
      key,
    );


  return (
    typeof candidate ===
      "string"
      ?
        candidate.trim()
      :
        ""
  );
}


function optionalValue(
  formData:
    FormData,
  key:
    string,
  maxLength:
    number,
): string |
  null {
  const candidate =
    value(
      formData,
      key,
    );


  if (
    !candidate
  ) {
    return null;
  }


  return candidate.slice(
    0,
    maxLength,
  );
}


export async function createProjectRevisionAction(
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


  await requireProjectEditor(
    user.id,
    projectId,
  );


  const result =
    await createProjectRevision({
      projectId,

      actorUserId:
        user.id,

      label:
        optionalValue(
          formData,
          "label",
          80,
        ),

      reason:
        optionalValue(
          formData,
          "reason",
          500,
        ),
    });


  revalidatePath(
    `/projects/${projectId}/versions`,
  );


  redirect(
    `/projects/${projectId}/versions?status=checkpoint-created&version=${result.version}`,
  );
}


export async function restoreProjectRevisionAction(
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


  const revisionId =
    value(
      formData,
      "revisionId",
    );


  await requireProjectEditor(
    user.id,
    projectId,
  );


  const result =
    await restoreProjectRevision({
      projectId,

      revisionId,

      actorUserId:
        user.id,

      reason:
        optionalValue(
          formData,
          "reason",
          500,
        ),
    });


  revalidatePath(
    `/projects/${projectId}`,
    "layout",
  );


  revalidatePath(
    `/projects/${projectId}/versions`,
  );


  redirect(
    `/projects/${projectId}/versions?status=restored&version=${result.version}`,
  );
}
