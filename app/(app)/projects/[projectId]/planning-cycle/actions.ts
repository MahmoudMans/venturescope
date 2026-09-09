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
  normalizeForecastCsv,
} from "@/lib/finance/analytics/csv";

import {
  parseBaselineKind,
} from "@/lib/finance/planning-cycle/baseline";

import {
  createForecastBaseline,
} from "@/lib/finance/planning-cycle/service";


const MAX_FORECAST_CSV_BYTES =
  512 *
  1024;


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
      "Unable to create forecast baseline.";
}


export async function createForecastBaselineAction(
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
    await requireProjectEditor(
      user.id,
      projectId,
    );


  let error:
    string |
    null =
      null;

  let baselineName =
    "";


  try {
    baselineName =
      formString(
        formData,
        "name",
      );


    if (
      baselineName.length <
        2 ||
      baselineName.length >
        80
    ) {
      throw new Error(
        "Baseline name must contain between 2 and 80 characters.",
      );
    }


    const kind =
      parseBaselineKind(
        formString(
          formData,
          "kind",
        ),
      );


    const forecastCsv =
      formString(
        formData,
        "forecastCsv",
      );


    if (
      !forecastCsv
    ) {
      throw new Error(
        "Current forecast data was not available.",
      );
    }


    if (
      Buffer.byteLength(
        forecastCsv,
        "utf8",
      ) >
      MAX_FORECAST_CSV_BYTES
    ) {
      throw new Error(
        "Forecast snapshot exceeds the 512 KB safety limit.",
      );
    }


    const rows =
      normalizeForecastCsv(
        forecastCsv,
      );


    if (
      rows.length ===
        0
    ) {
      throw new Error(
        "Current forecast export contains no usable financial periods.",
      );
    }


    await createForecastBaseline({
      projectId,

      actorUserId:
        user.id,

      name:
        baselineName,

      kind,

      modelVersion:
        project.modelVersion,

      rows,
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
    `/projects/${projectId}/planning-cycle`,
  );


  if (
    error
  ) {
    redirect(
      `/projects/${projectId}/planning-cycle?status=error&message=${encodeURIComponent(
        error,
      )}`,
    );
  }


  redirect(
    `/projects/${projectId}/planning-cycle?status=created&name=${encodeURIComponent(
      baselineName,
    )}`,
  );
}
