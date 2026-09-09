import {
  describe,
  expect,
  it,
} from "vitest";

import {
  parseRecoveryPeriod,
  parseVarianceCauseCode,
  parseVarianceCommentaryStatus,
  parseVarianceMetricCode,
  parseVarianceNature,
  parseVariancePeriod,
  varianceMetricDefinition,
} from "@/lib/finance/variance-review/metrics";


describe(
  "variance review validation",
  () => {
    it(
      "validates metric and cause codes",
      () => {
        expect(
          parseVarianceMetricCode(
            "REVENUE",
          ),
        ).toBe(
          "REVENUE",
        );


        expect(
          parseVarianceCauseCode(
            "VOLUME",
          ),
        ).toBe(
          "VOLUME",
        );
      },
    );


    it(
      "validates nature and status",
      () => {
        expect(
          parseVarianceNature(
            "RECURRING",
          ),
        ).toBe(
          "RECURRING",
        );


        expect(
          parseVarianceCommentaryStatus(
            "MONITORING",
          ),
        ).toBe(
          "MONITORING",
        );
      },
    );


    it(
      "normalizes review and recovery periods",
      () => {
        expect(
          parseVariancePeriod(
            "Jan 2027",
          ),
        ).toBe(
          "2027-01",
        );


        expect(
          parseRecoveryPeriod(
            "Mar 2027",
          ),
        ).toBe(
          "2027-03",
        );


        expect(
          parseRecoveryPeriod(
            "",
          ),
        ).toBeNull();
      },
    );


    it(
      "marks COGS as lower-is-favorable",
      () => {
        expect(
          varianceMetricDefinition(
            "COGS",
          ).favorableDirection,
        ).toBe(
          "LOWER",
        );
      },
    );
  },
);
