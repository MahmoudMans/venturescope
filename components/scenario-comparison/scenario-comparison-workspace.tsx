"use client";

import Link from "next/link";

import {
  useMemo,
  useState,
} from "react";

import {
  buildScenarioDecisionMatrix,
  cleanScenarioChangePath,
  compareScenarios,
} from "@/lib/projects/scenario-comparison/comparison";

import {
  summarizeJsonValue,
} from "@/lib/projects/version-diff/json";

import type {
  ScenarioComparisonView,
  ScenarioDivergence,
} from "@/lib/projects/scenario-comparison/types";


type Props = {
  projectId:
    string;

  scenarios:
    ScenarioComparisonView[];
};


function divergenceTone(
  divergence:
    ScenarioDivergence,
): string {
  switch (
    divergence
  ) {
    case "HIGH":
      return "text-destructive";

    case "MODERATE":
      return "text-amber-700 dark:text-amber-400";

    case "LOW":
      return "text-blue-700 dark:text-blue-400";

    case "IDENTICAL":
      return "text-emerald-700 dark:text-emerald-400";
  }
}


function changeTone(
  kind:
    string,
): string {
  switch (
    kind
  ) {
    case "ADDED":
      return "text-emerald-700 dark:text-emerald-400";

    case "REMOVED":
      return "text-destructive";

    case "TYPE_CHANGED":
      return "text-purple-700 dark:text-purple-400";

    default:
      return "";
  }
}


function numericDirectionTone(
  direction:
    string,
): string {
  return direction ===
    "INCREASED"
    ?
      "text-emerald-700 dark:text-emerald-400"
    :
      "text-destructive";
}


function percent(
  value:
    number |
    null,
): string {
  if (
    value ===
      null ||
    !Number.isFinite(
      value,
    )
  ) {
    return "—";
  }


  return new Intl.NumberFormat(
    "en",
    {
      style:
        "percent",

      maximumFractionDigits:
        1,
    },
  ).format(
    value,
  );
}


export function ScenarioComparisonWorkspace({
  projectId,
  scenarios,
}: Props) {
  const defaultReference =
    scenarios.find(
      (
        scenario,
      ) =>
        scenario.isBase,
    ) ??
    scenarios[
      0
    ] ??
    null;


  const defaultTarget =
    scenarios.find(
      (
        scenario,
      ) =>
        scenario.id !==
        defaultReference?.id,
    ) ??
    defaultReference;


  const [
    referenceId,
    setReferenceId,
  ] =
    useState(
      defaultReference?.id ??
      "",
    );


  const [
    targetId,
    setTargetId,
  ] =
    useState(
      defaultTarget?.id ??
      "",
    );


  const byId =
    useMemo(
      () =>
        new Map(
          scenarios.map(
            (
              scenario,
            ) => [
              scenario.id,
              scenario,
            ],
          ),
        ),
      [
        scenarios,
      ],
    );


  const reference =
    byId.get(
      referenceId,
    ) ??
    scenarios[
      0
    ] ??
    null;


  const target =
    byId.get(
      targetId,
    ) ??
    scenarios[
      1
    ] ??
    scenarios[
      0
    ] ??
    null;


  const comparison =
    useMemo(
      () =>
        reference &&
        target
          ?
            compareScenarios(
              reference,
              target,
            )
          :
            null,
      [
        reference,
        target,
      ],
    );


  const matrix =
    useMemo(
      () =>
        reference
          ?
            buildScenarioDecisionMatrix(
              reference,
              scenarios,
            )
          :
            [],
      [
        reference,
        scenarios,
      ],
    );


  const numericByPath =
    useMemo(
      () =>
        new Map(
          comparison
            ?.numericChanges
            .map(
              (
                change,
              ) => [
                change.path,
                change,
              ],
            ) ??
            [],
        ),
      [
        comparison,
      ],
    );


  if (
    scenarios.length ===
    0
  ) {
    return (
      <section className="rounded-xl border border-dashed p-8">
        <h2 className="font-semibold">
          No scenarios are available
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Create Base, Bull, Bear, or custom scenarios before opening the Scenario Comparison Center.
        </p>

        <Link
          href={`/projects/${projectId}/scenarios`}
          className="mt-5 inline-flex rounded-lg border px-3 py-2 text-sm font-medium"
        >
          Open Scenarios
        </Link>
      </section>
    );
  }


  if (
    scenarios.length ===
    1
  ) {
    return (
      <section className="rounded-xl border border-dashed p-8">
        <h2 className="font-semibold">
          A second scenario is required
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Scenario Comparison needs at least two scenario configurations. Your existing scenario remains unchanged.
        </p>

        <Link
          href={`/projects/${projectId}/scenarios`}
          className="mt-5 inline-flex rounded-lg border px-3 py-2 text-sm font-medium"
        >
          Create another scenario
        </Link>
      </section>
    );
  }


  return (
    <div className="space-y-8">
      <section className="rounded-xl border bg-background p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">
                Reference scenario
              </span>

              <select
                value={
                  referenceId
                }
                onChange={(
                  event,
                ) => {
                  setReferenceId(
                    event.target.value,
                  );
                }}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
              >
                {
                  scenarios.map(
                    (
                      scenario,
                    ) => (
                      <option
                        key={
                          scenario.id
                        }
                        value={
                          scenario.id
                        }
                      >
                        {
                          scenario.name
                        }
                        {
                          scenario.isBase
                            ?
                              " · Base"
                            :
                              ""
                        }
                      </option>
                    ),
                  )
                }
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">
                Compare with
              </span>

              <select
                value={
                  targetId
                }
                onChange={(
                  event,
                ) => {
                  setTargetId(
                    event.target.value,
                  );
                }}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
              >
                {
                  scenarios.map(
                    (
                      scenario,
                    ) => (
                      <option
                        key={
                          scenario.id
                        }
                        value={
                          scenario.id
                        }
                      >
                        {
                          scenario.name
                        }
                        {
                          scenario.isBase
                            ?
                              " · Base"
                            :
                              ""
                        }
                      </option>
                    ),
                  )
                }
              </select>
            </label>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setReferenceId(
                  targetId,
                );

                setTargetId(
                  referenceId,
                );
              }}
              className="h-10 rounded-lg border px-4 text-sm font-medium"
            >
              Swap
            </button>

            <Link
              href={`/projects/${projectId}/scenarios`}
              className="inline-flex h-10 items-center rounded-lg border px-4 text-sm font-medium"
            >
              Manage scenarios
            </Link>
          </div>
        </div>
      </section>

      {
        reference?.id ===
        target?.id
          ?
            (
              <section className="rounded-xl border border-dashed p-8 text-sm text-muted-foreground">
                Select two different scenarios to inspect their driver differences.
              </section>
            )
          :
            comparison
              ?
                (
                  <>
                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <article className="rounded-xl border bg-background p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Driver changes
                        </p>

                        <p className="mt-2 text-3xl font-semibold">
                          {
                            comparison
                              .summary
                              .totalChanges
                          }
                        </p>

                        <p className="mt-2 text-xs text-muted-foreground">
                          Recursive configuration differences.
                        </p>
                      </article>

                      <article className="rounded-xl border bg-background p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Divergence
                        </p>

                        <p className={`mt-2 text-3xl font-semibold ${divergenceTone(
                          comparison
                            .summary
                            .divergence,
                        )}`}>
                          {
                            comparison
                              .summary
                              .divergence
                          }
                        </p>

                        <p className="mt-2 text-xs text-muted-foreground">
                          Degree of configuration divergence, not financial quality.
                        </p>
                      </article>

                      <article className="rounded-xl border bg-background p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Numeric movements
                        </p>

                        <p className="mt-2 text-3xl font-semibold">
                          {
                            comparison
                              .summary
                              .numericIncreases
                          }
                          {" ↑ / "}
                          {
                            comparison
                              .summary
                              .numericDecreases
                          }
                          {" ↓"}
                        </p>

                        <p className="mt-2 text-xs text-muted-foreground">
                          Direction only; business meaning depends on the driver.
                        </p>
                      </article>

                      <article className="rounded-xl border bg-background p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Structural changes
                        </p>

                        <p className="mt-2 text-3xl font-semibold">
                          {
                            comparison
                              .summary
                              .structuralChanges
                          }
                        </p>

                        <p className="mt-2 text-xs text-muted-foreground">
                          Added, removed, or type-changed model drivers.
                        </p>
                      </article>
                    </section>

                    <section className="overflow-hidden rounded-xl border bg-background">
                      <div className="border-b p-5">
                        <h2 className="text-lg font-semibold">
                          Driver comparison
                        </h2>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {
                            reference.name
                          } → {
                            target.name
                          }
                        </p>
                      </div>

                      {
                        comparison.changes.length ===
                        0
                          ?
                            (
                              <div className="p-8 text-sm text-muted-foreground">
                                These two scenario configurations are identical.
                              </div>
                            )
                          :
                            (
                              <div className="overflow-x-auto">
                                <table className="w-full min-w-[1200px] text-sm">
                                  <thead>
                                    <tr className="border-b bg-muted/30">
                                      <th className="px-4 py-3 text-left">
                                        Change
                                      </th>

                                      <th className="px-4 py-3 text-left">
                                        Driver
                                      </th>

                                      <th className="px-4 py-3 text-left">
                                        Reference
                                      </th>

                                      <th className="px-4 py-3 text-left">
                                        Target
                                      </th>

                                      <th className="px-4 py-3 text-right">
                                        Numeric delta
                                      </th>

                                      <th className="px-4 py-3 text-right">
                                        Relative
                                      </th>
                                    </tr>
                                  </thead>

                                  <tbody>
                                    {
                                      comparison.changes.map(
                                        (
                                          change,
                                          index,
                                        ) => {
                                          const numeric =
                                            numericByPath.get(
                                              change.path,
                                            );


                                          return (
                                            <tr
                                              key={`${change.path}-${change.kind}-${index}`}
                                              className="border-b align-top last:border-0"
                                            >
                                              <td className={`px-4 py-3 font-medium ${changeTone(
                                                change.kind,
                                              )}`}>
                                                {
                                                  change.kind
                                                }
                                              </td>

                                              <td className="max-w-md px-4 py-3 font-mono text-xs">
                                                {
                                                  cleanScenarioChangePath(
                                                    change.path,
                                                  )
                                                }
                                              </td>

                                              <td className="max-w-sm px-4 py-3 font-mono text-xs text-muted-foreground">
                                                {
                                                  summarizeJsonValue(
                                                    change.before,
                                                  )
                                                }
                                              </td>

                                              <td className="max-w-sm px-4 py-3 font-mono text-xs">
                                                {
                                                  summarizeJsonValue(
                                                    change.after,
                                                  )
                                                }
                                              </td>

                                              <td className={`px-4 py-3 text-right tabular-nums ${
                                                numeric
                                                  ?
                                                    numericDirectionTone(
                                                      numeric.direction,
                                                    )
                                                  :
                                                    ""
                                              }`}>
                                                {
                                                  numeric
                                                    ?
                                                      `${
                                                        numeric.delta >
                                                        0
                                                          ?
                                                            "+"
                                                          :
                                                            ""
                                                      }${numeric.delta}`
                                                    :
                                                      "—"
                                                }
                                              </td>

                                              <td className="px-4 py-3 text-right tabular-nums">
                                                {
                                                  numeric
                                                    ?
                                                      percent(
                                                        numeric.relativeRate,
                                                      )
                                                    :
                                                      "—"
                                                }
                                              </td>
                                            </tr>
                                          );
                                        },
                                      )
                                    }
                                  </tbody>
                                </table>
                              </div>
                            )
                      }
                    </section>
                  </>
                )
              :
                null
      }

      <section className="overflow-hidden rounded-xl border bg-background">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">
            Scenario decision matrix
          </h2>

          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Every scenario is measured against the selected reference. Divergence indicates configuration distance only; VentureScope does not infer that an increase is automatically better or worse.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-left">
                  Scenario
                </th>

                <th className="px-4 py-3 text-left">
                  Role
                </th>

                <th className="px-4 py-3 text-right">
                  Changes
                </th>

                <th className="px-4 py-3 text-right">
                  Increased
                </th>

                <th className="px-4 py-3 text-right">
                  Decreased
                </th>

                <th className="px-4 py-3 text-right">
                  Added
                </th>

                <th className="px-4 py-3 text-right">
                  Removed
                </th>

                <th className="px-4 py-3 text-right">
                  Structural
                </th>

                <th className="px-4 py-3 text-left">
                  Divergence
                </th>
              </tr>
            </thead>

            <tbody>
              {
                matrix.map(
                  (
                    row,
                  ) => (
                    <tr
                      key={
                        row.scenarioId
                      }
                      className="border-b last:border-0"
                    >
                      <th className="px-4 py-3 text-left font-medium">
                        {
                          row.scenarioName
                        }
                      </th>

                      <td className="px-4 py-3">
                        {
                          row.isReference
                            ?
                              "REFERENCE"
                            :
                          row.isBase
                            ?
                              "BASE"
                            :
                              "ALTERNATIVE"
                        }
                      </td>

                      <td className="px-4 py-3 text-right">
                        {
                          row.totalChanges
                        }
                      </td>

                      <td className="px-4 py-3 text-right">
                        {
                          row.numericIncreases
                        }
                      </td>

                      <td className="px-4 py-3 text-right">
                        {
                          row.numericDecreases
                        }
                      </td>

                      <td className="px-4 py-3 text-right">
                        {
                          row.added
                        }
                      </td>

                      <td className="px-4 py-3 text-right">
                        {
                          row.removed
                        }
                      </td>

                      <td className="px-4 py-3 text-right">
                        {
                          row.structuralChanges
                        }
                      </td>

                      <td className={`px-4 py-3 font-medium ${divergenceTone(
                        row.divergence,
                      )}`}>
                        {
                          row.divergence
                        }
                      </td>
                    </tr>
                  ),
                )
              }
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border bg-muted/20 p-5">
        <h2 className="font-semibold">
          Comparison integrity
        </h2>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
          Scenario Comparison is intentionally a configuration-intelligence layer. It reuses the existing scenario definitions and Step 31 recursive diff authority. It does not duplicate financial formulas, execute an invented scenario engine, mutate scenarios, or claim that a positive numeric movement is economically favorable without knowing the meaning of that driver.
        </p>
      </section>
    </div>
  );
}
