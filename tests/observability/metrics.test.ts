import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  recordRequestObservation,
  resetRequestMetricsForTests,
  snapshotRequestMetrics,
} from "@/lib/observability/metrics";


describe(
  "process request metrics",
  () => {
    beforeEach(
      () => {
        resetRequestMetricsForTests();
      },
    );


    it(
      "aggregates requests without storing user payloads",
      () => {
        recordRequestObservation({
          route:
            "api.test",
          status:
            200,
          durationMs:
            10,
          failed:
            false,
        });

        recordRequestObservation({
          route:
            "api.test",
          status:
            500,
          durationMs:
            20,
          failed:
            true,
        });


        const snapshot =
          snapshotRequestMetrics();


        expect(
          snapshot.totalRequests,
        ).toBe(
          2,
        );

        expect(
          snapshot.failedRequests,
        ).toBe(
          1,
        );

        expect(
          snapshot.statuses,
        ).toEqual({
          "200":
            1,

          "500":
            1,
        });

        expect(
          snapshot.routes,
        ).toEqual({
          "api.test":
            2,
        });
      },
    );
  },
);
