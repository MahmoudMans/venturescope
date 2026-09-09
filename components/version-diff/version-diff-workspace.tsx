"use client";

import Link from "next/link";

import {
  useMemo,
  useState,
} from "react";

import {
  compareRevisionSnapshots,
} from "@/lib/projects/version-diff/diff";

import {
  summarizeJsonValue,
} from "@/lib/projects/version-diff/json";

import type {
  ModelChangeCategory,
  ModelChangeMateriality,
  RevisionDiffView,
} from "@/lib/projects/version-diff/types";


type Props = {
  projectId:
    string;

  revisions:
    RevisionDiffView[];
};


const CATEGORIES:
  (
    ModelChangeCategory |
    "ALL"
  )[] = [
    "ALL",
    "PROJECT",
    "ASSUMPTIONS",
    "SCENARIOS",
    "FINANCING",
    "OVERRIDES",
    "OTHER",
  ];


const MATERIALITIES:
  (
    ModelChangeMateriality |
    "ALL"
  )[] = [
    "ALL",
    "HIGH",
    "MEDIUM",
    "LOW",
  ];


function materialityTone(
  materiality:
    ModelChangeMateriality,
): string {
  switch (
    materiality
  ) {
    case "HIGH":
      return "text-destructive";

    case "MEDIUM":
      return "text-amber-700 dark:text-amber-400";

    case "LOW":
      return "text-muted-foreground";
  }
}


function kindTone(
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


function revisionLabel(
  revision:
    RevisionDiffView,
): string {
  return `v${revision.version}${
    revision.label
      ?
        ` · ${revision.label}`
      :
        ""
  }`;
}


export function VersionDiffWorkspace({
  projectId,
  revisions,
}: Props) {
  const initialFrom =
    revisions[
      1
    ]?.id ??
    revisions[
      0
    ]?.id ??
    "";


  const initialTo =
    revisions[
      0
    ]?.id ??
    "";


  const [
    fromId,
    setFromId,
  ] =
    useState(
      initialFrom,
    );


  const [
    toId,
    setToId,
  ] =
    useState(
      initialTo,
    );


  const [
    category,
    setCategory,
  ] =
    useState<
      ModelChangeCategory |
      "ALL"
    >(
      "ALL",
    );


  const [
    materiality,
    setMateriality,
  ] =
    useState<
      ModelChangeMateriality |
      "ALL"
    >(
      "ALL",
    );


  const byId =
    useMemo(
      () =>
        new Map(
          revisions.map(
            (
              revision,
            ) => [
              revision.id,
              revision,
            ],
          ),
        ),
      [
        revisions,
      ],
    );


  const fromRevision =
    byId.get(
      fromId,
    ) ??
    null;


  const toRevision =
    byId.get(
      toId,
    ) ??
    null;


  const diff =
    useMemo(
      () =>
        fromRevision &&
        toRevision
          ?
            compareRevisionSnapshots(
              fromRevision,
              toRevision,
            )
          :
            null,
      [
        fromRevision,
        toRevision,
      ],
    );


  const filteredChanges =
    useMemo(
      () =>
        diff
          ?
            diff.changes.filter(
              (
                change,
              ) =>
                (
                  category ===
                    "ALL" ||
                  change.category ===
                    category
                ) &&
                (
                  materiality ===
                    "ALL" ||
                  change.materiality ===
                    materiality
                ),
            )
          :
            [],
      [
        diff,
        category,
        materiality,
      ],
    );


  const sourceVersion = (
    revision:
      RevisionDiffView |
      null,
  ) => {
    if (
      !revision
      ?.sourceRevisionId
    ) {
      return null;
    }


    return byId.get(
      revision.sourceRevisionId,
    )?.version ??
      null;
  };


  if (
    revisions.length <
    2
  ) {
    return (
      <section className="rounded-xl border border-dashed p-8">
        <h2 className="font-semibold">
          Two model revisions are required
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Create at least two immutable model checkpoints before using Model Diff.
        </p>

        <Link
          href={`/projects/${projectId}/versions`}
          className="mt-5 inline-flex rounded-lg border px-3 py-2 text-sm font-medium"
        >
          Open model versions
        </Link>
      </section>
    );
  }


  return (
    <div className="space-y-8">
      <section className="rounded-xl border bg-background p-5 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-end">
          <label className="space-y-2">
            <span className="text-sm font-medium">
              From revision
            </span>

            <select
              value={
                fromId
              }
              onChange={(
                event,
              ) => {
                setFromId(
                  event.target.value,
                );
              }}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            >
              {
                revisions.map(
                  (
                    revision,
                  ) => (
                    <option
                      key={
                        revision.id
                      }
                      value={
                        revision.id
                      }
                    >
                      {
                        revisionLabel(
                          revision,
                        )
                      }
                    </option>
                  ),
                )
              }
            </select>
          </label>

          <button
            type="button"
            onClick={() => {
              setFromId(
                toId,
              );

              setToId(
                fromId,
              );
            }}
            className="h-10 rounded-lg border px-4 text-sm font-medium"
          >
            Swap
          </button>

          <label className="space-y-2">
            <span className="text-sm font-medium">
              To revision
            </span>

            <select
              value={
                toId
              }
              onChange={(
                event,
              ) => {
                setToId(
                  event.target.value,
                );
              }}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            >
              {
                revisions.map(
                  (
                    revision,
                  ) => (
                    <option
                      key={
                        revision.id
                      }
                      value={
                        revision.id
                      }
                    >
                      {
                        revisionLabel(
                          revision,
                        )
                      }
                    </option>
                  ),
                )
              }
            </select>
          </label>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {
            [
              [
                "FROM",
                fromRevision,
              ] as const,

              [
                "TO",
                toRevision,
              ] as const,
            ].map(
              (
                [
                  direction,
                  revision,
                ],
              ) => (
                <article
                  key={
                    String(
                      direction,
                    )
                  }
                  className="rounded-lg border p-4"
                >
                  <p className="text-xs font-semibold text-muted-foreground">
                    {
                      direction
                    }
                  </p>

                  {
                    revision
                      ?
                        (
                          <>
                            <p className="mt-2 font-semibold">
                              {
                                revisionLabel(
                                  revision,
                                )
                              }
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              {
                                new Date(
                                  revision.createdAt,
                                ).toLocaleString()
                              }
                            </p>

                            {
                              revision.reason
                                ?
                                  (
                                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                      {
                                        revision.reason
                                      }
                                    </p>
                                  )
                                :
                                  null
                            }

                            {
                              sourceVersion(
                                revision,
                              ) !==
                              null
                                ?
                                  (
                                    <p className="mt-3 text-xs font-medium">
                                      Restore lineage: v{
                                        sourceVersion(
                                          revision,
                                        )
                                      }
                                    </p>
                                  )
                                :
                                  null
                            }
                          </>
                        )
                      :
                        null
                  }
                </article>
              ),
            )
          }
        </div>
      </section>

      {
        fromRevision?.id ===
        toRevision?.id
          ?
            (
              <section className="rounded-xl border border-dashed p-8 text-sm text-muted-foreground">
                Select two different revisions to inspect model changes.
              </section>
            )
          :
            diff
              ?
                (
                  <>
                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <article className="rounded-xl border bg-background p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Total changes
                        </p>

                        <p className="mt-2 text-3xl font-semibold">
                          {
                            diff.summary
                              .total
                          }
                        </p>
                      </article>

                      <article className="rounded-xl border bg-background p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          High materiality
                        </p>

                        <p className={`mt-2 text-3xl font-semibold ${
                          diff.summary
                            .high >
                          0
                            ?
                              "text-destructive"
                            :
                              ""
                        }`}>
                          {
                            diff.summary
                              .high
                          }
                        </p>
                      </article>

                      <article className="rounded-xl border bg-background p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Added / removed
                        </p>

                        <p className="mt-2 text-3xl font-semibold">
                          {
                            diff.summary
                              .added
                          }
                          {" / "}
                          {
                            diff.summary
                              .removed
                          }
                        </p>
                      </article>

                      <article className="rounded-xl border bg-background p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Assumption changes
                        </p>

                        <p className="mt-2 text-3xl font-semibold">
                          {
                            diff.summary
                              .assumptions
                          }
                        </p>
                      </article>
                    </section>

                    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                      {
                        [
                          [
                            "Project",
                            diff.summary
                              .project,
                          ],

                          [
                            "Assumptions",
                            diff.summary
                              .assumptions,
                          ],

                          [
                            "Scenarios",
                            diff.summary
                              .scenarios,
                          ],

                          [
                            "Financing",
                            diff.summary
                              .financing,
                          ],

                          [
                            "Overrides",
                            diff.summary
                              .overrides,
                          ],

                          [
                            "Other",
                            diff.summary
                              .other,
                          ],
                        ].map(
                          (
                            [
                              label,
                              value,
                            ],
                          ) => (
                            <article
                              key={
                                String(
                                  label,
                                )
                              }
                              className="rounded-xl border bg-background p-4"
                            >
                              <p className="text-xs text-muted-foreground">
                                {
                                  label
                                }
                              </p>

                              <p className="mt-2 text-xl font-semibold">
                                {
                                  value
                                }
                              </p>
                            </article>
                          ),
                        )
                      }
                    </section>

                    <section className="rounded-xl border bg-background p-5">
                      <div className="grid gap-4 sm:grid-cols-2 lg:max-w-2xl">
                        <label className="space-y-2">
                          <span className="text-xs font-medium">
                            Category
                          </span>

                          <select
                            value={
                              category
                            }
                            onChange={(
                              event,
                            ) => {
                              setCategory(
                                event.target.value as
                                  ModelChangeCategory |
                                  "ALL",
                              );
                            }}
                            className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                          >
                            {
                              CATEGORIES.map(
                                (
                                  value,
                                ) => (
                                  <option
                                    key={
                                      value
                                    }
                                    value={
                                      value
                                    }
                                  >
                                    {
                                      value
                                    }
                                  </option>
                                ),
                              )
                            }
                          </select>
                        </label>

                        <label className="space-y-2">
                          <span className="text-xs font-medium">
                            Materiality
                          </span>

                          <select
                            value={
                              materiality
                            }
                            onChange={(
                              event,
                            ) => {
                              setMateriality(
                                event.target.value as
                                  ModelChangeMateriality |
                                  "ALL",
                              );
                            }}
                            className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                          >
                            {
                              MATERIALITIES.map(
                                (
                                  value,
                                ) => (
                                  <option
                                    key={
                                      value
                                    }
                                    value={
                                      value
                                    }
                                  >
                                    {
                                      value
                                    }
                                  </option>
                                ),
                              )
                            }
                          </select>
                        </label>
                      </div>
                    </section>

                    <section className="overflow-hidden rounded-xl border bg-background">
                      <div className="flex flex-col justify-between gap-3 border-b p-5 sm:flex-row sm:items-center">
                        <div>
                          <h2 className="text-lg font-semibold">
                            Model change register
                          </h2>

                          <p className="mt-1 text-sm text-muted-foreground">
                            Recursive comparison of immutable revision snapshots.
                          </p>
                        </div>

                        <p className="text-sm text-muted-foreground">
                          {
                            filteredChanges.length
                          } shown
                        </p>
                      </div>

                      {
                        filteredChanges.length ===
                        0
                          ?
                            (
                              <div className="p-8 text-sm text-muted-foreground">
                                No changes match the selected filters.
                              </div>
                            )
                          :
                            (
                              <div className="overflow-x-auto">
                                <table className="w-full min-w-[1200px] text-sm">
                                  <thead>
                                    <tr className="border-b bg-muted/30">
                                      <th className="px-4 py-3 text-left">
                                        Materiality
                                      </th>

                                      <th className="px-4 py-3 text-left">
                                        Category
                                      </th>

                                      <th className="px-4 py-3 text-left">
                                        Change
                                      </th>

                                      <th className="px-4 py-3 text-left">
                                        Model path
                                      </th>

                                      <th className="px-4 py-3 text-left">
                                        Before
                                      </th>

                                      <th className="px-4 py-3 text-left">
                                        After
                                      </th>
                                    </tr>
                                  </thead>

                                  <tbody>
                                    {
                                      filteredChanges.map(
                                        (
                                          change,
                                          index,
                                        ) => (
                                          <tr
                                            key={`${change.path}-${change.kind}-${index}`}
                                            className="border-b align-top last:border-0"
                                          >
                                            <td className={`px-4 py-3 font-semibold ${materialityTone(
                                              change.materiality,
                                            )}`}>
                                              {
                                                change.materiality
                                              }
                                            </td>

                                            <td className="px-4 py-3">
                                              {
                                                change.category
                                              }
                                            </td>

                                            <td className={`px-4 py-3 font-medium ${kindTone(
                                              change.kind,
                                            )}`}>
                                              {
                                                change.kind
                                              }
                                            </td>

                                            <td className="max-w-md px-4 py-3 font-mono text-xs">
                                              {
                                                change.path
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
                                          </tr>
                                        ),
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

      <section className="rounded-xl border bg-muted/20 p-5">
        <h2 className="font-semibold">
          Governance interpretation
        </h2>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
          Model Diff compares immutable model inputs and configuration. It does not restore either revision, modify the live model, or estimate financial impact by inventing a second forecast engine. High materiality identifies changes to major planning authorities such as assumptions, financing, overrides, or structural project settings.
        </p>
      </section>
    </div>
  );
}
