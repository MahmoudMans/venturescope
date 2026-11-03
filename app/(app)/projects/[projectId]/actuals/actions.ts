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
  decodeCsvBytes,
} from "@/lib/data-import/decode";

import {
  parseActualsCsv,
} from "@/lib/finance/actuals/csv";

import {
  clearProjectActuals,
  importActualPeriods,
} from "@/lib/finance/actuals/service";


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


function errorMessage(
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
      "Unable to import actuals.";
}


export async function importActualsAction(
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


  const uploaded =
    formData.get(
      "actualsCsv",
    );


  let failure:
    string |
    null =
      null;

  let imported =
    0;


  try {
    if (
      !(uploaded instanceof File) ||
      uploaded.size ===
        0
    ) {
      throw new Error(
        "Choose a CSV file containing monthly actual financials.",
      );
    }


    if (
      uploaded.size >
      512 *
      1024
    ) {
      throw new Error(
        "Actuals CSV exceeds the 512 KB limit.",
      );
    }


    const rows =
      parseActualsCsv(
        decodeCsvBytes(
          new Uint8Array(
            await uploaded.arrayBuffer(),
          ),
        ),
      );


    const result =
      await importActualPeriods({
        projectId,

        actorUserId:
          user.id,

        rows,
      });


    imported =
      result.imported;
  }
  catch (
    cause
  ) {
    failure =
      errorMessage(
        cause,
      );
  }


  revalidatePath(
    `/projects/${projectId}/actuals`,
  );


  if (
    failure
  ) {
    redirect(
      `/projects/${projectId}/actuals?status=error&message=${encodeURIComponent(
        failure,
      )}`,
    );
  }


  redirect(
    `/projects/${projectId}/actuals?status=imported&count=${imported}`,
  );
}


export async function clearActualsAction(
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


  const confirmation =
    formString(
      formData,
      "confirmation",
    );


  if (
    confirmation !==
    "CLEAR ACTUALS"
  ) {
    redirect(
      `/projects/${projectId}/actuals?status=error&message=${encodeURIComponent(
        "Type CLEAR ACTUALS to confirm deletion.",
      )}`,
    );
  }


  const result =
    await clearProjectActuals({
      projectId,

      actorUserId:
        user.id,
    });


  revalidatePath(
    `/projects/${projectId}/actuals`,
  );


  redirect(
    `/projects/${projectId}/actuals?status=cleared&count=${result.count}`,
  );
}
