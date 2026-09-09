import {
  describe,
  expect,
  it,
} from "vitest";

import {
  PLANNING_TEMPLATES,
  planningTemplateById,
  planningTemplateSegments,
} from "@/lib/finance/planning-templates/catalog";


describe(
  "planning template catalog",
  () => {
    it(
      "contains six built-in business models",
      () => {
        expect(
          PLANNING_TEMPLATES,
        ).toHaveLength(
          6,
        );
      },
    );


    it(
      "uses unique template IDs",
      () => {
        const ids =
          PLANNING_TEMPLATES.map(
            (
              template,
            ) =>
              template.id,
          );


        expect(
          new Set(
            ids,
          ).size,
        ).toBe(
          ids.length,
        );
      },
    );


    it(
      "provides assumptions KPIs risks and management questions",
      () => {
        for (
          const template
          of PLANNING_TEMPLATES
        ) {
          expect(
            template.assumptions.length,
          ).toBeGreaterThanOrEqual(
            5,
          );


          expect(
            template.kpis.length,
          ).toBeGreaterThanOrEqual(
            5,
          );


          expect(
            template.risks.length,
          ).toBeGreaterThanOrEqual(
            3,
          );


          expect(
            template.managementQuestions.length,
          ).toBeGreaterThanOrEqual(
            4,
          );
        }
      },
    );


    it(
      "resolves template IDs",
      () => {
        expect(
          planningTemplateById(
            "b2b-saas",
          )?.name,
        ).toBe(
          "B2B SaaS",
        );


        expect(
          planningTemplateById(
            "missing",
          ),
        ).toBeNull();
      },
    );


    it(
      "provides unique sorted segments",
      () => {
        const segments =
          planningTemplateSegments();


        expect(
          segments,
        ).toEqual(
          [
            ...segments,
          ].sort(),
        );


        expect(
          new Set(
            segments,
          ).size,
        ).toBe(
          segments.length,
        );
      },
    );
  },
);
