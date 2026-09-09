import {
  describe,
  expect,
  it,
} from "vitest";

import {
  DATA_IMPORT_MAX_ROWS,
  DATA_IMPORT_TEMPLATE,
  parseDataImportType,
} from "@/lib/data-import/catalog";


describe(
  "Data Import catalog",
  () => {
    it(
      "supports three governed import types",
      () => {
        expect(
          parseDataImportType(
            "ACTUALS",
          ),
        ).toBe(
          "ACTUALS",
        );


        expect(
          parseDataImportType(
            "KPI_TARGETS",
          ),
        ).toBe(
          "KPI_TARGETS",
        );


        expect(
          parseDataImportType(
            "VARIANCE_COMMENTARY",
          ),
        ).toBe(
          "VARIANCE_COMMENTARY",
        );
      },
    );


    it(
      "provides sample CSV templates",
      () => {
        expect(
          DATA_IMPORT_TEMPLATE
            .ACTUALS,
        ).toContain(
          "period,revenue",
        );


        expect(
          DATA_IMPORT_TEMPLATE
            .KPI_TARGETS,
        ).toContain(
          "metricCode",
        );


        expect(
          DATA_IMPORT_TEMPLATE
            .VARIANCE_COMMENTARY,
        ).toContain(
          "causeCode",
        );
      },
    );


    it(
      "preserves conservative Actuals row limit",
      () => {
        expect(
          DATA_IMPORT_MAX_ROWS
            .ACTUALS,
        ).toBe(
          120,
        );
      },
    );
  },
);
