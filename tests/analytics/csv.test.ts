import {
  describe,
  expect,
  it,
} from "vitest";

import {
  normalizeForecastCsv,
  parseCsvTable,
} from "@/lib/finance/analytics";


describe(
  "analytics forecast CSV parsing",
  () => {
    it(
      "parses quoted CSV values",
      () => {
        expect(
          parseCsvTable(
            'Month,Revenue\n"Jan, 2027","1,200"\n',
          ),
        ).toEqual([
          [
            "Month",
            "Revenue",
          ],

          [
            "Jan, 2027",
            "1,200",
          ],
        ]);
      },
    );


    it(
      "discovers the financial table after report preamble rows",
      () => {
        const rows =
          normalizeForecastCsv(
            [
              "VentureScope Export",
              "Project,Orbit Analytics",
              "",
              "Month,Revenue,COGS,EBITDA,Cash Balance,MRR,Customers,CAC,Churn Rate",
              "2027-01,10000,3000,1500,50000,8000,100,250,2%",
              "2027-02,12000,3600,2000,52000,9500,110,240,1.5%",
            ].join(
              "\n",
            ),
          );


        expect(
          rows,
        ).toHaveLength(
          2,
        );


        expect(
          rows[
            0
          ].revenue,
        ).toBe(
          10000,
        );


        expect(
          rows[
            0
          ].churnRate,
        ).toBe(
          0.02,
        );
      },
    );


    it(
      "parses parenthesized negatives",
      () => {
        const rows =
          normalizeForecastCsv(
            [
              "Month,Revenue,Cash Flow",
              "2027-01,1000,(250)",
            ].join(
              "\n",
            ),
          );


        expect(
          rows[
            0
          ].cashFlow,
        ).toBe(
          -250,
        );
      },
    );
  },
);
