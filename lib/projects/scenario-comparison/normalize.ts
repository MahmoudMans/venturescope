import type {
  JsonValue,
} from "@/lib/projects/version-diff/types";

import type {
  ScenarioComparisonView,
} from "@/lib/projects/scenario-comparison/types";


type UnknownRecord =
  Record<
    string,
    unknown
  >;


const PREFERRED_SCENARIO_KEYS = [
  "scenarios",
  "scenarioDefinitions",
  "scenarioConfigs",
  "scenarioConfigurations",
] as const;


const TOP_LEVEL_METADATA_KEYS =
  new Set([
    "id",
    "projectId",
    "createdAt",
    "updatedAt",
    "createdByUserId",
    "name",
    "label",
    "title",
    "scenarioName",
    "isBase",
    "isDefault",
    "selected",
    "active",
  ]);


function isRecord(
  value:
    unknown,
): value is
  UnknownRecord {
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


function looksLikeScenarioArray(
  value:
    unknown,
): value is
  unknown[] {
  if (
    !Array.isArray(
      value,
    )
  ) {
    return false;
  }


  if (
    value.length ===
    0
  ) {
    return true;
  }


  return value.every(
    (
      item,
    ) =>
      isRecord(
        item,
      ),
  );
}


export function extractScenarioCollection(
  project:
    unknown,
): unknown[] {
  if (
    Array.isArray(
      project,
    )
  ) {
    return project;
  }


  if (
    !isRecord(
      project,
    )
  ) {
    return [];
  }


  for (
    const key
    of PREFERRED_SCENARIO_KEYS
  ) {
    const candidate =
      project[
        key
      ];


    if (
      looksLikeScenarioArray(
        candidate,
      )
    ) {
      return candidate;
    }
  }


  for (
    const [
      key,
      candidate,
    ]
    of Object.entries(
      project,
    )
  ) {
    if (
      key
        .toLowerCase()
        .includes(
          "scenario",
        ) &&
      looksLikeScenarioArray(
        candidate,
      )
    ) {
      return candidate;
    }
  }


  return [];
}


function primitiveJson(
  value:
    unknown,
):
  | string
  | number
  | boolean
  | null
  | undefined {
  if (
    value ===
    null
  ) {
    return null;
  }


  if (
    typeof value ===
      "string" ||
    typeof value ===
      "boolean"
  ) {
    return value;
  }


  if (
    typeof value ===
    "number"
  ) {
    if (
      !Number.isFinite(
        value,
      )
    ) {
      throw new Error(
        "Scenario contains a non-finite numeric value.",
      );
    }


    return value;
  }


  return undefined;
}


function scenarioJsonValue(
  value:
    unknown,
  seen:
    WeakSet<
      object
    >,
): JsonValue {
  const primitive =
    primitiveJson(
      value,
    );


  if (
    primitive !==
    undefined
  ) {
    return primitive;
  }


  if (
    value instanceof Date
  ) {
    return value.toISOString();
  }


  if (
    Array.isArray(
      value,
    )
  ) {
    if (
      seen.has(
        value,
      )
    ) {
      throw new Error(
        "Scenario contains a circular array.",
      );
    }


    seen.add(
      value,
    );


    const normalized =
      value.map(
        (
          child,
        ) =>
          scenarioJsonValue(
            child,
            seen,
          ),
      );


    seen.delete(
      value,
    );


    return normalized;
  }


  if (
    !isRecord(
      value,
    )
  ) {
    throw new Error(
      "Scenario contains an unsupported value.",
    );
  }


  if (
    seen.has(
      value,
    )
  ) {
    throw new Error(
      "Scenario contains a circular object.",
    );
  }


  const toNumber =
    value[
      "toNumber"
    ];


  if (
    typeof toNumber ===
    "function"
  ) {
    const numeric =
      (
        toNumber as
          () => unknown
      ).call(
        value,
      );


    if (
      typeof numeric ===
        "number" &&
      Number.isFinite(
        numeric,
      )
    ) {
      return numeric;
    }
  }


  const toJSON =
    value[
      "toJSON"
    ];


  if (
    typeof toJSON ===
    "function"
  ) {
    const json =
      (
        toJSON as
          () => unknown
      ).call(
        value,
      );


    if (
      json !==
      value
    ) {
      return scenarioJsonValue(
        json,
        seen,
      );
    }
  }


  seen.add(
    value,
  );


  const normalized =
    Object.fromEntries(
      Object.entries(
        value,
      )
        .filter(
          (
            [
              ,
              child,
            ],
          ) =>
            child !==
              undefined &&
            typeof child !==
              "function" &&
            typeof child !==
              "symbol",
        )
        .sort(
          (
            left,
            right,
          ) =>
            left[
              0
            ].localeCompare(
              right[
                0
              ],
            ),
        )
        .map(
          (
            [
              key,
              child,
            ],
          ) => [
            key,
            scenarioJsonValue(
              child,
              seen,
            ),
          ],
        ),
    );


  seen.delete(
    value,
  );


  return normalized;
}


function scenarioId(
  record:
    UnknownRecord,
  index:
    number,
): string {
  const value =
    record[
      "id"
    ];


  if (
    typeof value ===
      "string" ||
    typeof value ===
      "number"
  ) {
    return String(
      value,
    );
  }


  return `scenario-${index + 1}`;
}


function scenarioName(
  record:
    UnknownRecord,
  index:
    number,
): string {
  for (
    const key
    of [
      "name",
      "label",
      "title",
      "scenarioName",
    ]
  ) {
    const value =
      record[
        key
      ];


    if (
      typeof value ===
        "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }


  return `Scenario ${index + 1}`;
}


function explicitBase(
  record:
    UnknownRecord,
): boolean {
  for (
    const key
    of [
      "isBase",
      "isDefault",
    ]
  ) {
    if (
      record[
        key
      ] ===
      true
    ) {
      return true;
    }
  }


  return false;
}


function scenarioSnapshot(
  record:
    UnknownRecord,
): JsonValue {
  const filtered =
    Object.fromEntries(
      Object.entries(
        record,
      )
        .filter(
          (
            [
              key,
            ],
          ) =>
            !TOP_LEVEL_METADATA_KEYS.has(
              key,
            ),
        )
        .sort(
          (
            left,
            right,
          ) =>
            left[
              0
            ].localeCompare(
              right[
                0
              ],
            ),
        ),
    );


  return scenarioJsonValue(
    filtered,
    new WeakSet(),
  );
}


export function normalizeScenarioCollection(
  projectOrScenarios:
    unknown,
): ScenarioComparisonView[] {
  const collection =
    extractScenarioCollection(
      projectOrScenarios,
    )
      .slice(
        0,
        20,
      );


  const candidates =
    collection.flatMap(
      (
        value,
        index,
      ) => {
        if (
          !isRecord(
            value,
          )
        ) {
          return [];
        }


        const name =
          scenarioName(
            value,
            index,
          );


        return [
          {
            id:
              scenarioId(
                value,
                index,
              ),

            name,

            isBase:
              explicitBase(
                value,
              ) ||
              name
                .trim()
                .toLowerCase() ===
                "base",

            snapshot:
              scenarioSnapshot(
                value,
              ),
          },
        ];
      },
    );


  if (
    candidates.length >
      0 &&
    !candidates.some(
      (
        candidate,
      ) =>
        candidate.isBase,
    )
  ) {
    return candidates.map(
      (
        candidate,
        index,
      ) => ({
        ...candidate,

        isBase:
          index ===
          0,
      }),
    );
  }


  return candidates;
}
