import {
  PLANNING_TEMPLATES,
} from "@/lib/finance/planning-templates/catalog";

import type {
  PlanningTemplate,
  PlanningTemplateFit,
  PlanningTemplateMatch,
} from "@/lib/finance/planning-templates/types";


function normalizeText(
  value:
    string,
): string {
  return value
    .normalize(
      "NFKD",
    )
    .replace(
      /[\u0300-\u036f]/gu,
      "",
    )
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/gu,
      " ",
    )
    .replace(
      /\s+/gu,
      " ",
    )
    .trim();
}


function tokens(
  value:
    string,
): Set<string> {
  return new Set(
    normalizeText(
      value,
    )
      .split(
        " ",
      )
      .filter(
        (
          token,
        ) =>
          token.length >=
          2,
      ),
  );
}


function fitForScore(
  score:
    number,
): PlanningTemplateFit {
  if (
    score >=
    60
  ) {
    return "RECOMMENDED";
  }


  if (
    score >=
    25
  ) {
    return "POSSIBLE";
  }


  return "EXPLORATORY";
}


export function scorePlanningTemplate({
  industry,
  template,
}: {
  industry:
    string;

  template:
    PlanningTemplate;
}): PlanningTemplateMatch {
  const normalizedIndustry =
    normalizeText(
      industry,
    );


  const industryTokens =
    tokens(
      industry,
    );


  let score =
    0;


  const reasons:
    string[] =
      [];


  const normalizedSegment =
    normalizeText(
      template.segment,
    );


  const normalizedName =
    normalizeText(
      template.name,
    );


  if (
    normalizedIndustry &&
    (
      normalizedIndustry ===
        normalizedSegment ||
      normalizedIndustry ===
        normalizedName
    )
  ) {
    score +=
      70;

    reasons.push(
      "Industry directly matches the template segment.",
    );
  }


  if (
    normalizedIndustry &&
    (
      normalizedIndustry.includes(
        normalizedName,
      ) ||
      normalizedName.includes(
        normalizedIndustry,
      )
    )
  ) {
    score +=
      25;

    reasons.push(
      "Industry closely matches the template name.",
    );
  }


  let keywordHits =
    0;


  for (
    const keyword
    of template.keywords
  ) {
    const normalizedKeyword =
      normalizeText(
        keyword,
      );


    if (
      normalizedKeyword &&
      (
        normalizedIndustry.includes(
          normalizedKeyword,
        ) ||
        normalizedKeyword.includes(
          normalizedIndustry,
        )
      )
    ) {
      keywordHits +=
        1;
    }
  }


  if (
    keywordHits >
    0
  ) {
    score +=
      Math.min(
        40,
        keywordHits *
        15,
      );

    reasons.push(
      `${keywordHits} industry keyword match${keywordHits === 1 ? "" : "es"}.`,
    );
  }


  const templateTokens =
    new Set(
      [
        template.name,
        template.segment,
        ...template.keywords,
      ].flatMap(
        (
          value,
        ) => [
          ...tokens(
            value,
          ),
        ],
      ),
    );


  const overlap =
    [
      ...industryTokens,
    ].filter(
      (
        token,
      ) =>
        templateTokens.has(
          token,
        ),
    );


  if (
    overlap.length >
    0
  ) {
    score +=
      Math.min(
        30,
        overlap.length *
        10,
      );

    reasons.push(
      `Shared industry terms: ${overlap.join(", ")}.`,
    );
  }


  const finalScore =
    Math.min(
      100,
      score,
    );


  if (
    reasons.length ===
    0
  ) {
    reasons.push(
      "No direct industry match; use this template only as an exploratory planning reference.",
    );
  }


  return {
    template,

    score:
      finalScore,

    fit:
      fitForScore(
        finalScore,
      ),

    reasons,
  };
}


export function rankPlanningTemplates(
  industry:
    string,
): PlanningTemplateMatch[] {
  return PLANNING_TEMPLATES
    .map(
      (
        template,
      ) =>
        scorePlanningTemplate({
          industry,

          template,
        }),
    )
    .sort(
      (
        left,
        right,
      ) => {
        const scoreDifference =
          right.score -
          left.score;


        if (
          scoreDifference !==
          0
        ) {
          return scoreDifference;
        }


        return left.template
          .name
          .localeCompare(
            right.template.name,
          );
      },
    );
}
