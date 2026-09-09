import {
  describe,
  expect,
  it,
} from "vitest";

import {
  rankPlanningTemplates,
  scorePlanningTemplate,
} from "@/lib/finance/planning-templates/matching";

import {
  planningTemplateById,
} from "@/lib/finance/planning-templates/catalog";


describe(
  "planning template matching",
  () => {
    it(
      "ranks SaaS first for a B2B software project",
      () => {
        const ranked =
          rankPlanningTemplates(
            "B2B SaaS software platform",
          );


        expect(
          ranked[
            0
          ].template.id,
        ).toBe(
          "b2b-saas",
        );


        expect(
          ranked[
            0
          ].fit,
        ).toBe(
          "RECOMMENDED",
        );
      },
    );


    it(
      "ranks local retail for salon businesses",
      () => {
        const ranked =
          rankPlanningTemplates(
            "Hair salon and local retail business",
          );


        expect(
          ranked[
            0
          ].template.id,
        ).toBe(
          "local-retail",
        );
      },
    );


    it(
      "ranks e-commerce for online stores",
      () => {
        const ranked =
          rankPlanningTemplates(
            "Online e-commerce store",
          );


        expect(
          ranked[
            0
          ].template.id,
        ).toBe(
          "ecommerce",
        );
      },
    );


    it(
      "keeps unknown industries exploratory",
      () => {
        const template =
          planningTemplateById(
            "b2b-saas",
          );


        if (
          !template
        ) {
          throw new Error(
            "Template missing.",
          );
        }


        const match =
          scorePlanningTemplate({
            industry:
              "deep sea mineral logistics",

            template,
          });


        expect(
          match.fit,
        ).toBe(
          "EXPLORATORY",
        );
      },
    );


    it(
      "produces deterministic rankings",
      () => {
        expect(
          rankPlanningTemplates(
            "consulting agency",
          ).map(
            (
              item,
            ) => [
              item.template.id,
              item.score,
            ],
          ),
        ).toEqual(
          rankPlanningTemplates(
            "consulting agency",
          ).map(
            (
              item,
            ) => [
              item.template.id,
              item.score,
            ],
          ),
        );
      },
    );
  },
);
