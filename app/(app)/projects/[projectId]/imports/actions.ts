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
  DATA_IMPORT_MAX_BYTES,
  parseDataImportType,
} from "@/lib/data-import/catalog";

import {
  applyGovernedDataImport,
} from "@/lib/data-import/service";


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
      value
    :
      "";
}


function errorMessage(
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
      "Data import failed.";
}


function safeFileName(
  value:
    string,
): string {
  const normalized =
    value
      .trim()
      .slice(
        0,
        160,
      );


  if (
    !normalized
  ) {
    return "import.csv";
  }


  return normalized.replace(
    /[^A-Za-z0-9._ -]/gu,
    "_",
  );
}


export async function applyDataImportAction(
  formData:
    FormData,
): Promise<void> {
  const user =
    await requireCurrentUserIdentity();


  const projectId =
    formString(
      formData,
      "projectId",
    ).trim();


  await requireProjectEditor(
    user.id,
    projectId,
  );


  let error:
    string |
    null =
      null;


  let batchId =
    "";


  try {
    const csv =
      formString(
        formData,
        "csv",
      );


    if (
      !csv.trim()
    ) {
      throw new Error(
        "CSV data is required.",
      );
    }


    if (
      new TextEncoder()
        .encode(
          csv,
        )
        .byteLength >
      DATA_IMPORT_MAX_BYTES
    ) {
      throw new Error(
        "CSV cannot exceed 512KB.",
      );
    }


    const result =
      await applyGovernedDataImport({
        projectId,

        actorUserId:
          user.id,

        importType:
          parseDataImportType(
            formString(
              formData,
              "importType",
            ).trim(),
          ),

        fileName:
          safeFileName(
            formString(
              formData,
              "fileName",
            ),
          ),

        csv,
      });


    batchId =
      result.batchId;
  }
  catch (
    cause
  ) {
    error =
      errorMessage(
        cause,
      );
  }


  revalidatePath(
    `/projects/${projectId}/imports`,
  );

  revalidatePath(
    `/projects/${projectId}/actuals`,
  );

  revalidatePath(
    `/projects/${projectId}/scorecard`,
  );

  revalidatePath(
    `/projects/${projectId}/variance-review`,
  );

  revalidatePath(
    `/projects/${projectId}/activity`,
  );

  revalidatePath(
    `/projects/${projectId}/alerts`,
  );


  if (
    error
  ) {
    redirect(
      `/projects/${projectId}/imports?status=error&message=${encodeURIComponent(
        error,
      )}`,
    );
  }


  redirect(
    `/projects/${projectId}/imports?status=imported&batch=${encodeURIComponent(
      batchId,
    )}`,
  );
}
