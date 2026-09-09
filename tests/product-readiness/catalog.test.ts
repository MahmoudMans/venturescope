import {
  describe,
  expect,
  it,
} from "vitest";

import {
  FINAL_MIGRATION_COUNT,
  FINAL_RELEASE_CHECKLIST,
  FINAL_RELEASE_STAGE_COUNT,
  PORTFOLIO_STORYBOARD,
  PRODUCT_CAPABILITIES,
  PRODUCT_GOVERNANCE_CONTROLS,
} from "@/lib/product-readiness/catalog";


describe(
  "final VentureScope product catalog",
  () => {
    it(
      "contains a substantial completed capability map",
      () => {
        expect(
          PRODUCT_CAPABILITIES.length,
        ).toBeGreaterThanOrEqual(
          15,
        );


        expect(
          PRODUCT_CAPABILITIES.every(
            (
              capability,
            ) =>
              capability.status ===
              "COMPLETE",
          ),
        ).toBe(
          true,
        );
      },
    );


    it(
      "uses unique capability identifiers",
      () => {
        const ids =
          PRODUCT_CAPABILITIES.map(
            (
              capability,
            ) =>
              capability.id,
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
      "uses project-relative private routes",
      () => {
        for (
          const capability
          of PRODUCT_CAPABILITIES
        ) {
          expect(
            capability.routeSuffix,
          ).toMatch(
            /^\//u,
          );


          expect(
            capability.routeSuffix,
          ).not.toContain(
            "/projects/",
          );
        }
      },
    );


    it(
      "contains enforced governance controls",
      () => {
        expect(
          PRODUCT_GOVERNANCE_CONTROLS.length,
        ).toBeGreaterThanOrEqual(
          10,
        );


        expect(
          PRODUCT_GOVERNANCE_CONTROLS.every(
            (
              control,
            ) =>
              control.status ===
              "ENFORCED",
          ),
        ).toBe(
          true,
        );
      },
    );


    it(
      "defines nine portfolio capture screens",
      () => {
        expect(
          PORTFOLIO_STORYBOARD,
        ).toHaveLength(
          9,
        );


        expect(
          PORTFOLIO_STORYBOARD
            .map(
              (
                item,
              ) =>
                item.order,
            )
            .sort(
              (
                left,
                right,
              ) =>
                left -
                right,
            ),
        ).toEqual([
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
        ]);
      },
    );


    it(
      "keeps every final checklist item ready",
      () => {
        expect(
          FINAL_RELEASE_CHECKLIST.every(
            (
              item,
            ) =>
              item.status ===
              "READY",
          ),
        ).toBe(
          true,
        );
      },
    );


    it(
      "locks final roadmap migration and release-stage expectations",
      () => {
        expect(
          FINAL_MIGRATION_COUNT,
        ).toBe(
          17,
        );


        expect(
          FINAL_RELEASE_STAGE_COUNT,
        ).toBe(
          37,
        );
      },
    );
  },
);
