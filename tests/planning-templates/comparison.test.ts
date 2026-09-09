import {
  describe,
  expect,
  it,
} from "vitest";

import {
  planningTemplateById,
} from "@/lib/finance/planning-templates/catalog";

import {
  buildPlanningTemplateBrief,
  comparePlanningTemplates,
} from "@/lib/finance/planning-templates/comparison";


function template(
  id:
    string,
) {
  const result =
    planningTemplateById(
      id,
    );


  if (
    !result
  ) {
    throw new Error(
      `Template ${id} missing.`,
    );
  }


  return result;
}


describe(
  "planning template comparison",
  () => {
    it(
      "creates union of assumption keys",
      () => {
        const rows =
          comparePlanningTemplates(
            template(
              "b2b-saas",
            ),
            template(
              "ecommerce",
            ),
          );


        expect(
          rows.length,
        ).toBeGreaterThan(
          5,
        );


        expect(
          rows.some(
            (
              row,
            ) =>
              row.key ===
              "monthly_arpu",
          ),
        ).toBe(
          true,
        );


        expect(
          rows.some(
            (
              row,
            ) =>
              row.key ===
              "average_order_value",
          ),
        ).toBe(
          true,
        );
      },
    );


    it(
      "builds management planning brief",
      () => {
        const brief =
          buildPlanningTemplateBrief(
            template(
              "b2b-saas",
            ),
          );


        expect(
          brief.title,
        ).toContain(
          "B2B SaaS",
        );


        expect(
          brief.revenueFocus.length,
        ).toBeGreaterThan(
          20,
        );


        expect(
          brief.kpiFocus,
        ).toContain(
          "MRR",
        );
      },
    );
  },
);
