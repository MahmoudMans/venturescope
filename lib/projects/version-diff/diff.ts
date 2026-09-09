import type {
  JsonValue,
  ModelChange,
  ModelChangeCategory,
  ModelChangeKind,
  ModelChangeMateriality,
  ModelDiffSummary,
  ModelVersionDiff,
  RevisionDiffView,
} from "@/lib/projects/version-diff/types";


function isObject(
  value:
    JsonValue,
): value is
  {
    [
      key:
        string
    ]:
      JsonValue;
  } {
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


function valueType(
  value:
    JsonValue,
): string {
  if (
    value ===
    null
  ) {
    return "null";
  }


  if (
    Array.isArray(
      value,
    )
  ) {
    return "array";
  }


  return typeof value;
}


function categoryForPath(
  path:
    string,
): ModelChangeCategory {
  const normalized =
    path.toLowerCase();


  if (
    normalized.includes(
      "baseassumptions",
    ) ||
    normalized.includes(
      ".assumptions",
    )
  ) {
    return "ASSUMPTIONS";
  }


  if (
    normalized.includes(
      "scenarios",
    )
  ) {
    return "SCENARIOS";
  }


  if (
    normalized.includes(
      "financing",
    )
  ) {
    return "FINANCING";
  }


  if (
    normalized.includes(
      "monthlyoverrides",
    ) ||
    normalized.includes(
      "overrides",
    )
  ) {
    return "OVERRIDES";
  }


  const projectPaths = [
    "$.name",
    "$.industry",
    "$.currency",
    "$.startmonth",
    "$.horizonmonths",
    "$.revenuemode",
    "$.modelversion",
  ];


  if (
    projectPaths.some(
      (
        projectPath,
      ) =>
        normalized.startsWith(
          projectPath,
        ),
    )
  ) {
    return "PROJECT";
  }


  return "OTHER";
}


function materialityForChange({
  path,
  category,
  kind,
}: {
  path:
    string;

  category:
    ModelChangeCategory;

  kind:
    ModelChangeKind;
}): ModelChangeMateriality {
  if (
    kind ===
    "TYPE_CHANGED"
  ) {
    return "HIGH";
  }


  if (
    category ===
      "FINANCING" ||
    category ===
      "ASSUMPTIONS" ||
    category ===
      "OVERRIDES"
  ) {
    return "HIGH";
  }


  if (
    category ===
    "SCENARIOS"
  ) {
    return "MEDIUM";
  }


  const normalized =
    path.toLowerCase();


  if (
    category ===
      "PROJECT" &&
    (
      normalized.includes(
        "currency",
      ) ||
      normalized.includes(
        "startmonth",
      ) ||
      normalized.includes(
        "horizonmonths",
      ) ||
      normalized.includes(
        "revenuemode",
      )
    )
  ) {
    return "HIGH";
  }


  if (
    category ===
    "PROJECT"
  ) {
    return "MEDIUM";
  }


  return "LOW";
}


function change({
  path,
  kind,
  before,
  after,
}: {
  path:
    string;

  kind:
    ModelChangeKind;

  before:
    JsonValue |
    null;

  after:
    JsonValue |
    null;
}): ModelChange {
  const category =
    categoryForPath(
      path,
    );


  return {
    path,

    kind,

    category,

    materiality:
      materialityForChange({
        path,

        category,

        kind,
      }),

    before,

    after,
  };
}


function identityForArrayValue(
  value:
    JsonValue,
): string |
  null {
  if (
    !isObject(
      value,
    )
  ) {
    return null;
  }


  for (
    const key
    of [
      "id",
      "period",
      "name",
    ]
  ) {
    const candidate =
      value[
        key
      ];


    if (
      typeof candidate ===
        "string" ||
      typeof candidate ===
        "number"
    ) {
      return `${key}:${String(
        candidate,
      )}`;
    }
  }


  return null;
}


function identityMap(
  values:
    JsonValue[],
): Map<
  string,
  JsonValue
> |
  null {
  const map =
    new Map<
      string,
      JsonValue
    >();


  for (
    const value
    of values
  ) {
    const identity =
      identityForArrayValue(
        value,
      );


    if (
      !identity ||
      map.has(
        identity,
      )
    ) {
      return null;
    }


    map.set(
      identity,
      value,
    );
  }


  return map;
}


function diffArray({
  before,
  after,
  path,
  changes,
}: {
  before:
    JsonValue[];

  after:
    JsonValue[];

  path:
    string;

  changes:
    ModelChange[];
}) {
  const beforeByIdentity =
    identityMap(
      before,
    );


  const afterByIdentity =
    identityMap(
      after,
    );


  if (
    beforeByIdentity &&
    afterByIdentity
  ) {
    const identities =
      [
        ...new Set([
          ...beforeByIdentity.keys(),
          ...afterByIdentity.keys(),
        ]),
      ].sort();


    for (
      const identity
      of identities
    ) {
      const beforeValue =
        beforeByIdentity.get(
          identity,
        );


      const afterValue =
        afterByIdentity.get(
          identity,
        );


      const childPath =
        `${path}[${identity}]`;


      if (
        beforeValue ===
        undefined
      ) {
        changes.push(
          change({
            path:
              childPath,

            kind:
              "ADDED",

            before:
              null,

            after:
              afterValue ??
              null,
          }),
        );

        continue;
      }


      if (
        afterValue ===
        undefined
      ) {
        changes.push(
          change({
            path:
              childPath,

            kind:
              "REMOVED",

            before:
              beforeValue,

            after:
              null,
          }),
        );

        continue;
      }


      diffValue({
        before:
          beforeValue,

        after:
          afterValue,

        path:
          childPath,

        changes,
      });
    }


    return;
  }


  const length =
    Math.max(
      before.length,
      after.length,
    );


  for (
    let index =
      0;
    index <
      length;
    index +=
      1
  ) {
    const beforeExists =
      index <
      before.length;


    const afterExists =
      index <
      after.length;


    const childPath =
      `${path}[${index}]`;


    if (
      !beforeExists
    ) {
      changes.push(
        change({
          path:
            childPath,

          kind:
            "ADDED",

          before:
            null,

          after:
            after[
              index
            ] ??
            null,
        }),
      );

      continue;
    }


    if (
      !afterExists
    ) {
      changes.push(
        change({
          path:
            childPath,

          kind:
            "REMOVED",

          before:
            before[
              index
            ] ??
            null,

          after:
            null,
        }),
      );

      continue;
    }


    diffValue({
      before:
        before[
          index
        ] ?? null,

      after:
        after[
          index
        ] ?? null,

      path:
        childPath,

      changes,
    });
  }
}


function diffObject({
  before,
  after,
  path,
  changes,
}: {
  before:
    {
      [
        key:
          string
      ]:
        JsonValue;
    };

  after:
    {
      [
        key:
          string
      ]:
        JsonValue;
    };

  path:
    string;

  changes:
    ModelChange[];
}) {
  const keys =
    [
      ...new Set([
        ...Object.keys(
          before,
        ),
        ...Object.keys(
          after,
        ),
      ]),
    ].sort();


  for (
    const key
    of keys
  ) {
    const beforeExists =
      Object.prototype
        .hasOwnProperty
        .call(
          before,
          key,
        );


    const afterExists =
      Object.prototype
        .hasOwnProperty
        .call(
          after,
          key,
        );


    const childPath =
      `${path}.${key}`;


    if (
      !beforeExists
    ) {
      changes.push(
        change({
          path:
            childPath,

          kind:
            "ADDED",

          before:
            null,

          after:
            after[
              key
            ] ?? null,
        }),
      );

      continue;
    }


    if (
      !afterExists
    ) {
      changes.push(
        change({
          path:
            childPath,

          kind:
            "REMOVED",

          before:
            before[
              key
            ] ?? null,

          after:
            null,
        }),
      );

      continue;
    }


    diffValue({
      before:
        before[
          key
        ] ?? null,

      after:
        after[
          key
        ] ?? null,

      path:
        childPath,

      changes,
    });
  }
}


function diffValue({
  before,
  after,
  path,
  changes,
}: {
  before:
    JsonValue;

  after:
    JsonValue;

  path:
    string;

  changes:
    ModelChange[];
}) {
  if (
    Object.is(
      before,
      after,
    )
  ) {
    return;
  }


  const beforeType =
    valueType(
      before,
    );


  const afterType =
    valueType(
      after,
    );


  if (
    beforeType !==
    afterType
  ) {
    changes.push(
      change({
        path,

        kind:
          "TYPE_CHANGED",

        before,

        after,
      }),
    );

    return;
  }


  if (
    Array.isArray(
      before,
    ) &&
    Array.isArray(
      after,
    )
  ) {
    diffArray({
      before,

      after,

      path,

      changes,
    });

    return;
  }


  if (
    isObject(
      before,
    ) &&
    isObject(
      after,
    )
  ) {
    diffObject({
      before,

      after,

      path,

      changes,
    });

    return;
  }


  changes.push(
    change({
      path,

      kind:
        "CHANGED",

      before,

      after,
    }),
  );
}


function summary(
  changes:
    ModelChange[],
): ModelDiffSummary {
  return {
    total:
      changes.length,

    high:
      changes.filter(
        (
          item,
        ) =>
          item.materiality ===
          "HIGH",
      ).length,

    medium:
      changes.filter(
        (
          item,
        ) =>
          item.materiality ===
          "MEDIUM",
      ).length,

    low:
      changes.filter(
        (
          item,
        ) =>
          item.materiality ===
          "LOW",
      ).length,

    added:
      changes.filter(
        (
          item,
        ) =>
          item.kind ===
          "ADDED",
      ).length,

    removed:
      changes.filter(
        (
          item,
        ) =>
          item.kind ===
          "REMOVED",
      ).length,

    changed:
      changes.filter(
        (
          item,
        ) =>
          item.kind ===
          "CHANGED",
      ).length,

    typeChanged:
      changes.filter(
        (
          item,
        ) =>
          item.kind ===
          "TYPE_CHANGED",
      ).length,

    assumptions:
      changes.filter(
        (
          item,
        ) =>
          item.category ===
          "ASSUMPTIONS",
      ).length,

    scenarios:
      changes.filter(
        (
          item,
        ) =>
          item.category ===
          "SCENARIOS",
      ).length,

    financing:
      changes.filter(
        (
          item,
        ) =>
          item.category ===
          "FINANCING",
      ).length,

    overrides:
      changes.filter(
        (
          item,
        ) =>
          item.category ===
          "OVERRIDES",
      ).length,

    project:
      changes.filter(
        (
          item,
        ) =>
          item.category ===
          "PROJECT",
      ).length,

    other:
      changes.filter(
        (
          item,
        ) =>
          item.category ===
          "OTHER",
      ).length,
  };
}


const MATERIALITY_ORDER = {
  HIGH:
    0,

  MEDIUM:
    1,

  LOW:
    2,
} as const;


export function compareRevisionSnapshots(
  from:
    RevisionDiffView,
  to:
    RevisionDiffView,
): ModelVersionDiff {
  const changes:
    ModelChange[] =
      [];


  diffValue({
    before:
      from.snapshot,

    after:
      to.snapshot,

    path:
      "$",

    changes,
  });


  changes.sort(
    (
      left,
      right,
    ) => {
      const materiality =
        MATERIALITY_ORDER[
          left.materiality
        ] -
        MATERIALITY_ORDER[
          right.materiality
        ];


      if (
        materiality !==
        0
      ) {
        return materiality;
      }


      return left.path.localeCompare(
        right.path,
      );
    },
  );


  return {
    fromVersion:
      from.version,

    toVersion:
      to.version,

    changes,

    summary:
      summary(
        changes,
      ),
  };
}
