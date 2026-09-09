import {
  PROJECT_REVISION_SCHEMA_VERSION,
  type ProjectRevisionSnapshot,
} from "@/lib/projects/versioning/types";


type JsonRecord =
  Record<
    string,
    unknown
  >;


function isRecord(
  value:
    unknown,
): value is
  JsonRecord {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  );
}


function cloneSerializable(
  value:
    unknown,
): unknown {
  return JSON.parse(
    JSON.stringify(
      value,
    ),
  ) as
    unknown;
}


function recordArray(
  value:
    unknown,
  name:
    string,
): JsonRecord[] {
  if (
    !Array.isArray(
      value,
    )
  ) {
    throw new Error(
      `Invalid revision snapshot: ${name} is not an array.`,
    );
  }


  return value.map(
    (
      row,
    ) => {
      if (
        !isRecord(
          row,
        )
      ) {
        throw new Error(
          `Invalid revision snapshot: ${name} contains a non-object row.`,
        );
      }


      return row;
    },
  );
}


export function parseProjectRevisionSnapshot(
  value:
    unknown,
): ProjectRevisionSnapshot {
  if (
    !isRecord(
      value,
    )
  ) {
    throw new Error(
      "Invalid project revision snapshot.",
    );
  }


  if (
    value.schemaVersion !==
    PROJECT_REVISION_SCHEMA_VERSION
  ) {
    throw new Error(
      "Unsupported project revision schema version.",
    );
  }


  if (
    typeof value.capturedAt !==
    "string"
  ) {
    throw new Error(
      "Invalid revision capture timestamp.",
    );
  }


  if (
    !isRecord(
      value.project,
    )
  ) {
    throw new Error(
      "Invalid revision project state.",
    );
  }


  const project =
    value.project;


  if (
    typeof project.name !==
      "string" ||
    (
      project.industry !==
        null &&
      typeof project.industry !==
        "string"
    ) ||
    typeof project.currency !==
      "string" ||
    typeof project.startMonth !==
      "string" ||
    typeof project.horizonMonths !==
      "number" ||
    typeof project.revenueMode !==
      "string"
  ) {
    throw new Error(
      "Invalid revision project settings.",
    );
  }


  return {
    schemaVersion:
      PROJECT_REVISION_SCHEMA_VERSION,

    capturedAt:
      value.capturedAt,

    project: {
      name:
        project.name,

      industry:
        project.industry,

      currency:
        project.currency,

      startMonth:
        project.startMonth,

      horizonMonths:
        project.horizonMonths,

      revenueMode:
        project.revenueMode,

      baseAssumptions:
        cloneSerializable(
          project.baseAssumptions,
        ),
    },

    scenarios:
      recordArray(
        value.scenarios,
        "scenarios",
      ),

    financingEvents:
      recordArray(
        value.financingEvents,
        "financingEvents",
      ),

    monthlyOverrides:
      recordArray(
        value.monthlyOverrides,
        "monthlyOverrides",
      ),
  };
}


export function prepareRelationRows(
  rows:
    JsonRecord[],
  projectId:
    string,
): JsonRecord[] {
  return rows.map(
    (
      row,
    ) => {
      const prepared:
        JsonRecord =
          {};


      for (
        const [
          key,
          value,
        ]
        of Object.entries(
          row,
        )
      ) {
        if (
          key ===
            "projectId" ||
          key ===
            "createdAt" ||
          key ===
            "updatedAt"
        ) {
          continue;
        }


        prepared[
          key
        ] =
          cloneSerializable(
            value,
          );
      }


      prepared.projectId =
        projectId;


      return prepared;
    },
  );
}
