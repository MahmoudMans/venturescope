import {
  describe,
  expect,
  it,
} from "vitest";

import {
  validateDataImportCsv,
} from "@/lib/data-import/validation";


describe(
  "Data Import validation",
  () => {
    it(
      "validates Actuals CSV",
      () => {
        const result =
          validateDataImportCsv({
            importType:
              "ACTUALS",

            csv:
              "period,revenue,cashBalance,customers\n2027-01,1000,5000,10",
          });


        expect(
          result.issues,
        ).toHaveLength(
          0,
        );


        expect(
          result.rows[
            0
          ],
        ).toMatchObject({
          kind:
            "ACTUALS",

          periodKey:
            "2027-01",

          revenue:
            1000,

          cashBalance:
            5000,

          customers:
            10,
        });
      },
    );


    it(
      "normalizes KPI percentage target values",
      () => {
        const result =
          validateDataImportCsv({
            importType:
              "KPI_TARGETS",

            csv:
              "periodKey,metricCode,targetValue\n2027-01,EBITDA_MARGIN,20",
          });


        expect(
          result.issues,
        ).toHaveLength(
          0,
        );


        expect(
          result.rows[
            0
          ],
        ).toMatchObject({
          kind:
            "KPI_TARGETS",

          targetValue:
            0.20,
        });
      },
    );


    it(
      "validates Variance Commentary CSV",
      () => {
        const result =
          validateDataImportCsv({
            importType:
              "VARIANCE_COMMENTARY",

            csv:
              "periodKey,metricCode,causeCode,varianceNature,explanation,status\n2027-01,REVENUE,VOLUME,RECURRING,Sales volume below plan,MONITORING",
          });


        expect(
          result.issues,
        ).toHaveLength(
          0,
        );


        expect(
          result.rows[
            0
          ],
        ).toMatchObject({
          kind:
            "VARIANCE_COMMENTARY",

          metricCode:
            "REVENUE",

          causeCode:
            "VOLUME",

          status:
            "MONITORING",
        });
      },
    );


    it(
      "rejects missing required headers",
      () => {
        expect(
          () =>
            validateDataImportCsv({
              importType:
                "KPI_TARGETS",

              csv:
                "periodKey,targetValue\n2027-01,100",
            }),
        ).toThrow(
          /missing required csv headers/i,
        );
      },
    );


    it(
      "detects duplicate import identities",
      () => {
        const result =
          validateDataImportCsv({
            importType:
              "KPI_TARGETS",

            csv: [
              "periodKey,metricCode,targetValue",
              "2027-01,REVENUE,100",
              "2027-01,REVENUE,200",
            ].join(
              "\n",
            ),
          });


        expect(
          result.issues.some(
            (
              issue,
            ) =>
              issue.field ===
              "duplicate",
          ),
        ).toBe(
          true,
        );


        expect(
          result.rows,
        ).toHaveLength(
          0,
        );
      },
    );


    it(
      "rejects invalid customer values",
      () => {
        const result =
          validateDataImportCsv({
            importType:
              "ACTUALS",

            csv:
              "period,customers\n2027-01,10.5",
          });


        expect(
          result.issues.some(
            (
              issue,
            ) =>
              issue.field ===
              "customers",
          ),
        ).toBe(
          true,
        );
      },
    );
  },
);
