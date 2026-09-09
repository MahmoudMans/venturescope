import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildProductReadinessSummary,
} from "@/lib/product-readiness/calculations";


describe(
  "final product readiness summary",
  () => {
    it(
      "summarizes the feature-complete product",
      () => {
        const summary =
          buildProductReadinessSummary();


        expect(
          summary.status,
        ).toBe(
          "FEATURE_COMPLETE",
        );


        expect(
          summary.migrationCount,
        ).toBe(
          17,
        );


        expect(
          summary.releaseStageCount,
        ).toBe(
          37,
        );


        expect(
          summary.paidApiCount,
        ).toBe(
          0,
        );
      },
    );


    it(
      "contains nine portfolio storyboard screens",
      () => {
        expect(
          buildProductReadinessSummary()
            .storyboardCount,
        ).toBe(
          9,
        );
      },
    );
  },
);
