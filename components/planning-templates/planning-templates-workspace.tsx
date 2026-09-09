"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  PLANNING_TEMPLATES,
  planningTemplateSegments,
} from "@/lib/finance/planning-templates/catalog";

import {
  buildPlanningTemplateBrief,
  comparePlanningTemplates,
} from "@/lib/finance/planning-templates/comparison";

import {
  rankPlanningTemplates,
} from "@/lib/finance/planning-templates/matching";

import type {
  PlanningTemplate,
  PlanningTemplateAssumption,
  PlanningTemplateFit,
} from "@/lib/finance/planning-templates/types";


type Props = {
  projectName:
    string;

  projectIndustry:
    string;

  currency:
    string;
};


function fitTone(
  fit:
    PlanningTemplateFit,
): string {
  switch (
    fit
  ) {
    case "RECOMMENDED":
      return "text-emerald-700 dark:text-emerald-400";

    case "POSSIBLE":
      return "text-blue-700 dark:text-blue-400";

    case "EXPLORATORY":
      return "text-muted-foreground";
  }
}


function riskTone(
  severity:
    string,
): string {
  switch (
    severity
  ) {
    case "HIGH":
      return "text-destructive";

    case "MEDIUM":
      return "text-amber-700 dark:text-amber-400";

    default:
      return "text-muted-foreground";
  }
}


function assumptionValue({
  assumption,
  currency,
}: {
  assumption:
    PlanningTemplateAssumption |
    null;

  currency:
    string;
}): string {
  if (
    !assumption
  ) {
    return "—";
  }


  const value =
    assumption.value;


  if (
    typeof value ===
    "string"
  ) {
    return value;
  }


  switch (
    assumption.unit
  ) {
    case "%":
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


    case "currency":
      return new Intl.NumberFormat(
        "en",
        {
          style:
            "currency",

          currency,

          maximumFractionDigits:
            0,
        },
      ).format(
        value,
      );


    case "months":
      return `${value} months`;


    case "days":
      return `${value} days`;


    case "count":
      return new Intl.NumberFormat(
        "en",
        {
          maximumFractionDigits:
            0,
        },
      ).format(
        value,
      );


    case "x":
      return `${value}x`;


    case "text":
      return String(
        value,
      );
  }
}


function templateSearchText(
  template:
    PlanningTemplate,
): string {
  return [
    template.name,
    template.segment,
    template.description,
    ...template.keywords,
    ...template.kpis,
    ...template.risks.map(
      (
        risk,
      ) =>
        risk.title,
    ),
  ]
    .join(
      " ",
    )
    .toLowerCase();
}


export function PlanningTemplatesWorkspace({
  projectName,
  projectIndustry,
  currency,
}: Props) {
  const ranked =
    useMemo(
      () =>
        rankPlanningTemplates(
          projectIndustry,
        ),
      [
        projectIndustry,
      ],
    );


  const bestMatch =
    ranked[
      0
    ] ??
    null;


  const [
    search,
    setSearch,
  ] =
    useState(
      "",
    );


  const [
    segment,
    setSegment,
  ] =
    useState(
      "ALL",
    );


  const [
    selectedId,
    setSelectedId,
  ] =
    useState(
      bestMatch?.template.id ??
      PLANNING_TEMPLATES[
        0
      ]?.id ??
      "",
    );


  const [
    compareId,
    setCompareId,
  ] =
    useState(
      PLANNING_TEMPLATES.find(
        (
          template,
        ) =>
          template.id !==
          (
            bestMatch?.template.id ??
            ""
          ),
      )?.id ??
      "",
    );


  const filtered =
    useMemo(
      () => {
        const needle =
          search
            .trim()
            .toLowerCase();


        return PLANNING_TEMPLATES.filter(
          (
            template,
          ) =>
            (
              segment ===
                "ALL" ||
              template.segment ===
                segment
            ) &&
            (
              !needle ||
              templateSearchText(
                template,
              ).includes(
                needle,
              )
            ),
        );
      },
      [
        search,
        segment,
      ],
    );


  const selected =
    PLANNING_TEMPLATES.find(
      (
        template,
      ) =>
        template.id ===
        selectedId,
    ) ??
    PLANNING_TEMPLATES[
      0
    ];


  const comparison =
    PLANNING_TEMPLATES.find(
      (
        template,
      ) =>
        template.id ===
        compareId,
    ) ??
    null;  const brief =
    selected
      ?
        buildPlanningTemplateBrief(
          selected,
        )
      :
        null;


  const comparisonRows =
    selected &&
    comparison &&
    selected.id !==
      comparison.id
      ?
        comparePlanningTemplates(
          selected,
          comparison,
        )
      :
        [];


  return (
    <div className="space-y-8">
      <section className="rounded-xl border bg-background p-5 sm:p-6">
        <p className="text-sm font-medium text-muted-foreground">
          Current project
        </p>

        <div className="mt-2 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h2 className="text-2xl font-semibold">
              {
                projectName
              }
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Industry: {
                projectIndustry ||
                "Not specified"
              }
            </p>
          </div>

          {
            bestMatch
              ?
                (
                  <div className="rounded-lg border px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Best template match
                    </p>

                    <p className="mt-1 font-semibold">
                      {
                        bestMatch.template.name
                      }
                    </p>

                    <p className={`mt-1 text-xs font-semibold ${fitTone(
                      bestMatch.fit,
                    )}`}>
                      {
                        bestMatch.fit
                      }
                      {" · "}
                      {
                        bestMatch.score
                      }
                      /100
                    </p>
                  </div>
                )
              :
                null
          }
        </div>

        {
          bestMatch
            ?
              (
                <div className="mt-5 rounded-lg bg-muted/30 p-4">
                  <p className="text-sm font-medium">
                    Why this match?
                  </p>

                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {
                      bestMatch.reasons.map(
                        (
                          reason,
                        ) => (
                          <li
                            key={
                              reason
                            }
                          >
                            • {
                              reason
                            }
                          </li>
                        ),
                      )
                    }
                  </ul>
                </div>
              )
            :
              null
        }
      </section>

      <section className="rounded-xl border bg-background p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium">
              Search templates
            </span>

            <input
              value={
                search
              }
              onChange={(
                event,
              ) => {
                setSearch(
                  event.target.value,
                );
              }}
              placeholder="SaaS, retail, subscription..."
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">
              Segment
            </span>

            <select
              value={
                segment
              }
              onChange={(
                event,
              ) => {
                setSegment(
                  event.target.value,
                );
              }}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            >
              <option value="ALL">
                All segments
              </option>

              {
                planningTemplateSegments().map(
                  (
                    item,
                  ) => (
                    <option
                      key={
                        item
                      }
                      value={
                        item
                      }
                    >
                      {
                        item
                      }
                    </option>
                  ),
                )
              }
            </select>
          </label>
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">
              Template library
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {
                filtered.length
              } built-in planning model{
                filtered.length ===
                  1
                  ?
                    ""
                  :
                    "s"
              }
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {
            filtered.map(
              (
                template,
              ) => {
                const match =
                  ranked.find(
                    (
                      item,
                    ) =>
                      item.template.id ===
                      template.id,
                  );


                const active =
                  selected?.id ===
                  template.id;


                return (
                  <article
                    key={
                      template.id
                    }
                    className={`rounded-xl border p-5 ${
                      active
                        ?
                          "ring-2 ring-foreground/20"
                        :
                          ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {
                            template.segment
                          }
                        </p>

                        <h3 className="mt-1 text-lg font-semibold">
                          {
                            template.name
                          }
                        </h3>
                      </div>

                      {
                        match
                          ?
                            (
                              <span className={`text-xs font-semibold ${fitTone(
                                match.fit,
                              )}`}>
                                {
                                  match.score
                                }
                                /100
                              </span>
                            )
                          :
                            null
                      }
                    </div>

                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {
                        template.description
                      }
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded border px-2 py-1 text-xs">
                        {
                          template.revenueModel
                        }
                      </span>

                      <span className="rounded border px-2 py-1 text-xs">
                        {
                          template.horizonGuidance
                        } mo
                      </span>

                      <span className="rounded border px-2 py-1 text-xs">
                        {
                          template.assumptions.length
                        } assumptions
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(
                          template.id,
                        );
                      }}
                      className="mt-5 rounded-lg border px-3 py-2 text-sm font-medium"
                    >
                      {
                        active
                          ?
                            "Selected"
                          :
                            "Explore model"
                      }
                    </button>
                  </article>
                );
              },
            )
          }
        </div>
      </section>

      {
        selected &&
        brief
          ?
            (
              <>
                <section className="rounded-xl border bg-background">
                  <div className="border-b p-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Selected industry model
                    </p>

                    <h2 className="mt-1 text-2xl font-semibold">
                      {
                        selected.name
                      }
                    </h2>

                    <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
                      {
                        selected.description
                      }
                    </p>
                  </div>

                  <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-5">
                    <article className="rounded-lg border p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Revenue
                      </p>

                      <p className="mt-2 text-sm leading-6">
                        {
                          brief.revenueFocus
                        }
                      </p>
                    </article>

                    <article className="rounded-lg border p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Operations
                      </p>

                      <p className="mt-2 text-sm leading-6">
                        {
                          brief.operatingFocus
                        }
                      </p>
                    </article>

                    <article className="rounded-lg border p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Liquidity
                      </p>

                      <p className="mt-2 text-sm leading-6">
                        {
                          brief.liquidityFocus
                        }
                      </p>
                    </article>

                    <article className="rounded-lg border p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        KPIs
                      </p>

                      <p className="mt-2 text-sm leading-6">
                        {
                          brief.kpiFocus
                        }
                      </p>
                    </article>

                    <article className="rounded-lg border p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Risks
                      </p>

                      <p className="mt-2 text-sm leading-6">
                        {
                          brief.riskFocus
                        }
                      </p>
                    </article>
                  </div>
                </section>

                <section className="overflow-hidden rounded-xl border bg-background">
                  <div className="border-b p-5">
                    <h2 className="text-xl font-semibold">
                      Suggested model assumptions
                    </h2>

                    <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                      These values are starting-point planning references only. They are not written into your VentureScope model automatically.
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="px-4 py-3 text-left">
                            Area
                          </th>

                          <th className="px-4 py-3 text-left">
                            Assumption
                          </th>

                          <th className="px-4 py-3 text-right">
                            Starting reference
                          </th>

                          <th className="px-4 py-3 text-left">
                            Planning rationale
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {
                          selected.assumptions.map(
                            (
                              assumption,
                            ) => (
                              <tr
                                key={
                                  assumption.key
                                }
                                className="border-b align-top last:border-0"
                              >
                                <td className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                                  {
                                    assumption.area
                                  }
                                </td>

                                <th className="px-4 py-3 text-left">
                                  {
                                    assumption.label
                                  }
                                </th>

                                <td className="px-4 py-3 text-right font-semibold tabular-nums">
                                  {
                                    assumptionValue({
                                      assumption,

                                      currency,
                                    })
                                  }
                                </td>

                                <td className="max-w-lg px-4 py-3 text-sm leading-6 text-muted-foreground">
                                  {
                                    assumption.rationale
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

                <section className="grid gap-4 lg:grid-cols-2">
                  <article className="rounded-xl border bg-background p-5">
                    <h2 className="text-xl font-semibold">
                      Management KPI focus
                    </h2>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {
                        selected.kpis.map(
                          (
                            kpi,
                          ) => (
                            <span
                              key={
                                kpi
                              }
                              className="rounded-lg border px-3 py-2 text-sm"
                            >
                              {
                                kpi
                              }
                            </span>
                          ),
                        )
                      }
                    </div>
                  </article>

                  <article className="rounded-xl border bg-background p-5">
                    <h2 className="text-xl font-semibold">
                      Risk watchlist
                    </h2>

                    <div className="mt-4 space-y-4">
                      {
                        selected.risks.map(
                          (
                            risk,
                          ) => (
                            <div
                              key={
                                risk.title
                              }
                              className="rounded-lg border p-4"
                            >
                              <p className={`text-xs font-semibold ${riskTone(
                                risk.severity,
                              )}`}>
                                {
                                  risk.severity
                                }
                              </p>

                              <p className="mt-1 font-medium">
                                {
                                  risk.title
                                }
                              </p>

                              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                {
                                  risk.watch
                                }
                              </p>
                            </div>
                          ),
                        )
                      }
                    </div>
                  </article>
                </section>

                <section className="rounded-xl border bg-background p-5">
                  <h2 className="text-xl font-semibold">
                    Management questions
                  </h2>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {
                      selected.managementQuestions.map(
                        (
                          question,
                          index,
                        ) => (
                          <article
                            key={
                              question
                            }
                            className="rounded-lg border p-4"
                          >
                            <p className="text-xs font-medium text-muted-foreground">
                              Question {
                                index +
                                1
                              }
                            </p>

                            <p className="mt-2 text-sm font-medium leading-6">
                              {
                                question
                              }
                            </p>
                          </article>
                        ),
                      )
                    }
                  </div>
                </section>

                <section className="rounded-xl border bg-background">
                  <div className="border-b p-5">
                    <h2 className="text-xl font-semibold">
                      Compare industry models
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Compare planning assumptions without changing either template or the current project.
                    </p>
                  </div>

                  <div className="grid gap-4 border-b p-5 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium">
                        Primary
                      </span>

                      <select
                        value={
                          selected.id
                        }
                        onChange={(
                          event,
                        ) => {
                          setSelectedId(
                            event.target.value,
                          );
                        }}
                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                      >
                        {
                          PLANNING_TEMPLATES.map(
                            (
                              template,
                            ) => (
                              <option
                                key={
                                  template.id
                                }
                                value={
                                  template.id
                                }
                              >
                                {
                                  template.name
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
                          compareId
                        }
                        onChange={(
                          event,
                        ) => {
                          setCompareId(
                            event.target.value,
                          );
                        }}
                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                      >
                        {
                          PLANNING_TEMPLATES.map(
                            (
                              template,
                            ) => (
                              <option
                                key={
                                  template.id
                                }
                                value={
                                  template.id
                                }
                              >
                                {
                                  template.name
                                }
                              </option>
                            ),
                          )
                        }
                      </select>
                    </label>
                  </div>

                  {
                    comparisonRows.length ===
                    0
                      ?
                        (
                          <div className="p-8 text-sm text-muted-foreground">
                            Choose a different second template to compare assumptions.
                          </div>
                        )
                      :
                        (
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-sm">
                              <thead>
                                <tr className="border-b bg-muted/30">
                                  <th className="px-4 py-3 text-left">
                                    Area
                                  </th>

                                  <th className="px-4 py-3 text-left">
                                    Assumption
                                  </th>

                                  <th className="px-4 py-3 text-right">
                                    {
                                      selected.name
                                    }
                                  </th>

                                  <th className="px-4 py-3 text-right">
                                    {
                                      comparison?.name ??
                                      "Comparison"
                                    }
                                  </th>
                                </tr>
                              </thead>

                              <tbody>
                                {
                                  comparisonRows.map(
                                    (
                                      row,
                                    ) => (
                                      <tr
                                        key={
                                          row.key
                                        }
                                        className="border-b last:border-0"
                                      >
                                        <td className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                                          {
                                            row.area
                                          }
                                        </td>

                                        <th className="px-4 py-3 text-left">
                                          {
                                            row.label
                                          }
                                        </th>

                                        <td className="px-4 py-3 text-right">
                                          {
                                            assumptionValue({
                                              assumption:
                                                row.left,

                                              currency,
                                            })
                                          }
                                        </td>

                                        <td className="px-4 py-3 text-right">
                                          {
                                            assumptionValue({
                                              assumption:
                                                row.right,

                                              currency,
                                            })
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

                <section className="rounded-xl border bg-muted/20 p-5">
                  <h2 className="font-semibold">
                    Template integrity
                  </h2>

                  <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
                    Industry templates are immutable planning references. They do not alter forecasts, Actuals, scenarios, KPI targets, risk policies, baselines, financial-close status, management commentary, or model revisions. The suggested values are starting points for management discussion rather than universal industry benchmarks.
                  </p>
                </section>
              </>
            )
          :
            null
      }
    </div>
  );
}
