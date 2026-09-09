import {
  compareRevisionSnapshots,
} from "@/lib/projects/version-diff/diff";

import type {
  JsonValue,
  RevisionDiffView,
} from "@/lib/projects/version-diff/types";

import type {
  ScenarioComparisonResult,
  ScenarioComparisonSummary,
  ScenarioComparisonView,
  ScenarioDecisionMatrixRow,
  ScenarioDivergence,
  ScenarioNumericChange,
} from "@/lib/projects/scenario-comparison/types";


function scenarioRevision(
  scenario:
    ScenarioComparisonView,
  version:
    number,
): RevisionDiffView {
  const scenarioObject =
    scenario.snapshot;


  const wrapped:
    JsonValue = {
      scenarios: [
        {
          id:
            "comparison",

          config:
            scenarioObject,
        },
      ],
    };


  return {
    id:
      scenario.id,

    version,

    label:
      scenario.name,

    reason:
      null,

    sourceRevisionId:
      null,

    createdAt:
      "1970-01-01T00:00:00.000Z",

    snapshot:
      wrapped,
  };
}


function relativeRate(
  before:
    number,
  delta:
    number,
): number |
  null {
  if (
    before ===
    0
  ) {
    return null;
  }


  return (
    delta /
    Math.abs(
      before,
    )
  );
}


function numericChanges(
  changes:
    ReturnType<
      typeof compareRevisionSnapshots
    >[
      "changes"
    ],
): ScenarioNumericChange[] {
  return changes.flatMap(
    (
      change,
    ) => {
      if (
        typeof change.before !==
          "number" ||
        typeof change.after !==
          "number"
      ) {
        return [];
      }


      const delta =
        change.after -
        change.before;


      if (
        delta ===
        0
      ) {
        return [];
      }


      return [
        {
          path:
            change.path,

          before:
            change.before,

          after:
            change.after,

          delta,

          relativeRate:
            relativeRate(
              change.before,
              delta,
            ),

          direction:
            delta >
              0
              ?
                "INCREASED" as const
              :
                "DECREASED" as const,
        },
      ];
    },
  );
}


function divergence(
  totalChanges:
    number,
): ScenarioDivergence {
  if (
    totalChanges ===
    0
  ) {
    return "IDENTICAL";
  }


  if (
    totalChanges <=
    2
  ) {
    return "LOW";
  }


  if (
    totalChanges <=
    5
  ) {
    return "MODERATE";
  }


  return "HIGH";
}


function summary(
  result:
    ReturnType<
      typeof compareRevisionSnapshots
    >,
  numerics:
    ScenarioNumericChange[],
): ScenarioComparisonSummary {
  const structuralChanges =
    result.changes.filter(
      (
        change,
      ) =>
        change.kind ===
          "ADDED" ||
        change.kind ===
          "REMOVED" ||
        change.kind ===
          "TYPE_CHANGED",
    ).length;


  return {
    totalChanges:
      result.summary
        .total,

    added:
      result.summary
        .added,

    removed:
      result.summary
        .removed,

    changed:
      result.summary
        .changed,

    typeChanged:
      result.summary
        .typeChanged,

    numericIncreases:
      numerics.filter(
        (
          numeric,
        ) =>
          numeric.direction ===
          "INCREASED",
      ).length,

    numericDecreases:
      numerics.filter(
        (
          numeric,
        ) =>
          numeric.direction ===
          "DECREASED",
      ).length,

    structuralChanges,

    divergence:
      divergence(
        result.summary
          .total,
      ),
  };
}


export function compareScenarios(
  reference:
    ScenarioComparisonView,
  target:
    ScenarioComparisonView,
): ScenarioComparisonResult {
  const result =
    compareRevisionSnapshots(
      scenarioRevision(
        reference,
        1,
      ),
      scenarioRevision(
        target,
        2,
      ),
    );


  const numerics =
    numericChanges(
      result.changes,
    );


  return {
    reference,

    target,

    changes:
      result.changes,

    numericChanges:
      numerics,

    summary:
      summary(
        result,
        numerics,
      ),
  };
}


export function buildScenarioDecisionMatrix(
  reference:
    ScenarioComparisonView,
  scenarios:
    ScenarioComparisonView[],
): ScenarioDecisionMatrixRow[] {
  return scenarios.map(
    (
      scenario,
    ) => {
      if (
        scenario.id ===
        reference.id
      ) {
        return {
          scenarioId:
            scenario.id,

          scenarioName:
            scenario.name,

          isReference:
            true,

          isBase:
            scenario.isBase,

          totalChanges:
            0,

          added:
            0,

          removed:
            0,

          changed:
            0,

          typeChanged:
            0,

          numericIncreases:
            0,

          numericDecreases:
            0,

          structuralChanges:
            0,

          divergence:
            "IDENTICAL",
        };
      }


      const comparison =
        compareScenarios(
          reference,
          scenario,
        );


      return {
        scenarioId:
          scenario.id,

        scenarioName:
          scenario.name,

        isReference:
          false,

        isBase:
          scenario.isBase,

        ...comparison.summary,
      };
    },
  );
}


export function cleanScenarioChangePath(
  path:
    string,
): string {
  const prefix =
    "$.scenarios[id:comparison].config";


  if (
    path ===
    prefix
  ) {
    return "$";
  }


  if (
    path.startsWith(
      `${prefix}.`,
    )
  ) {
    return `$${path.slice(
      prefix.length,
    )}`;
  }


  if (
    path.startsWith(
      `${prefix}[`,
    )
  ) {
    return `$${path.slice(
      prefix.length,
    )}`;
  }


  return path;
}
