import type {
  PlanningTemplate,
  PlanningTemplateBrief,
  PlanningTemplateComparisonRow,
} from "@/lib/finance/planning-templates/types";


export function comparePlanningTemplates(
  left:
    PlanningTemplate,
  right:
    PlanningTemplate,
): PlanningTemplateComparisonRow[] {
  const keys =
    [
      ...new Set(
        [
          ...left.assumptions.map(
            (
              assumption,
            ) =>
              assumption.key,
          ),

          ...right.assumptions.map(
            (
              assumption,
            ) =>
              assumption.key,
          ),
        ],
      ),
    ];


  return keys
    .map(
      (
        key,
      ) => {
        const leftAssumption =
          left.assumptions.find(
            (
              assumption,
            ) =>
              assumption.key ===
              key,
          ) ??
          null;


        const rightAssumption =
          right.assumptions.find(
            (
              assumption,
            ) =>
              assumption.key ===
              key,
          ) ??
          null;


        const source =
          leftAssumption ??
          rightAssumption;


        if (
          !source
        ) {
          throw new Error(
            "Planning Template comparison invariant failed.",
          );
        }


        return {
          key,

          label:
            source.label,

          area:
            source.area,

          left:
            leftAssumption,

          right:
            rightAssumption,
        };
      },
    )
    .sort(
      (
        leftRow,
        rightRow,
      ) => {
        const area =
          leftRow.area.localeCompare(
            rightRow.area,
          );


        if (
          area !==
          0
        ) {
          return area;
        }


        return leftRow.label.localeCompare(
          rightRow.label,
        );
      },
    );
}


export function buildPlanningTemplateBrief(
  template:
    PlanningTemplate,
): PlanningTemplateBrief {
  const revenue =
    template.assumptions.filter(
      (
        assumption,
      ) =>
        assumption.area ===
        "REVENUE",
    );


  const operations =
    template.assumptions.filter(
      (
        assumption,
      ) =>
        assumption.area ===
          "OPEX" ||
        assumption.area ===
          "OPERATIONS",
    );


  const cash =
    template.assumptions.filter(
      (
        assumption,
      ) =>
        assumption.area ===
        "CASH",
    );


  const highRisks =
    template.risks.filter(
      (
        risk,
      ) =>
        risk.severity ===
        "HIGH",
    );


  return {
    templateId:
      template.id,

    title:
      `${template.name} planning brief`,

    revenueFocus:
      revenue.length >
        0
        ?
          `Build the revenue plan around ${revenue.map(
            (
              assumption,
            ) =>
              assumption.label.toLowerCase(),
          ).join(", ")}.`
        :
          "Define explicit operating drivers behind revenue.",

    operatingFocus:
      operations.length >
        0
        ?
          `Track ${operations.map(
            (
              assumption,
            ) =>
              assumption.label.toLowerCase(),
          ).join(", ")} as explicit operating assumptions.`
        :
          "Keep operating-cost assumptions visible and measurable.",

    liquidityFocus:
      cash.length >
        0
        ?
          `Protect liquidity using ${cash.map(
            (
              assumption,
            ) =>
              assumption.label.toLowerCase(),
          ).join(", ")}.`
        :
          "Establish a management cash floor and downside liquidity case.",

    kpiFocus:
      `Prioritize ${template.kpis.slice(
        0,
        5,
      ).join(", ")}.`,

    riskFocus:
      highRisks.length >
        0
        ?
          `Highest-priority risks: ${highRisks.map(
            (
              risk,
            ) =>
              risk.title,
          ).join(", ")}.`
        :
          `Monitor ${template.risks.map(
            (
              risk,
            ) =>
              risk.title,
          ).join(", ")}.`,
  };
}
