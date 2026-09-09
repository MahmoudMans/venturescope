import {
  describe,
  expect,
  it,
} from "vitest";

import {
  PLANNING_TEMPLATES,
} from "@/lib/finance/planning-templates/catalog";


describe(
  "planning template immutability",
  () => {
    it(
      "freezes catalog and template objects",
      () => {
        expect(
          Object.isFrozen(
            PLANNING_TEMPLATES,
          ),
        ).toBe(
          true,
        );


        for (
          const template
          of PLANNING_TEMPLATES
        ) {
          expect(
            Object.isFrozen(
              template,
            ),
          ).toBe(
            true,
          );


          expect(
            Object.isFrozen(
              template.assumptions,
            ),
          ).toBe(
            true,
          );


          expect(
            Object.isFrozen(
              template.kpis,
            ),
          ).toBe(
            true,
          );


          expect(
            Object.isFrozen(
              template.risks,
            ),
          ).toBe(
            true,
          );
        }
      },
    );


    it(
      "freezes nested assumptions and risks",
      () => {
        const first =
          PLANNING_TEMPLATES[
            0
          ];


        expect(
          first,
        ).toBeDefined();


        expect(
          Object.isFrozen(
            first.assumptions[
              0
            ],
          ),
        ).toBe(
          true,
        );


        expect(
          Object.isFrozen(
            first.risks[
              0
            ],
          ),
        ).toBe(
          true,
        );
      },
    );
  },
);
