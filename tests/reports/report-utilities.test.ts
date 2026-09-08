import {
  describe,
  expect,
  it,
} from "vitest";

import {
  reportFilename,
  safeReportFilenamePart,
} from "@/lib/reports/filename";

describe(
  "report filename safety",
  () => {
    it(
      "removes unsafe filename characters",
      () => {
        expect(
          safeReportFilenamePart(
            "Acme & Café / 2027",
          ),
        ).toBe(
          "acme-cafe-2027",
        );
      },
    );

    it(
      "creates scenario-specific CSV filenames",
      () => {
        expect(
          reportFilename(
            "Orbit Analytics",
            "Bull Case",
            "csv",
          ),
        ).toBe(
          "venturescope-orbit-analytics-bull-case-forecast.csv",
        );
      },
    );

    it(
      "creates scenario-specific PDF filenames",
      () => {
        expect(
          reportFilename(
            "Orbit Analytics",
            "Bear Case",
            "pdf",
          ),
        ).toBe(
          "venturescope-orbit-analytics-bear-case-forecast.pdf",
        );
      },
    );
  },
);
