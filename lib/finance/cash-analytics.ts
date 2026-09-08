import {
  averageDecimals,
  decimal,
  sumDecimals,
  toFinancialString,
} from "@/lib/finance/math";
import type {
  MonthlyForecast,
} from "@/lib/finance/types";

export type AnnualCashAnalytics = {
  year: number;

  monthsIncluded: number;

  openingCash: string;

  operatingCashInflow: string;

  operatingCashOutflow: string;

  operatingCashFlow: string;

  financingInflow: string;

  debtPrincipalRepayment: string;

  netCashMovement: string;

  endingCash: string;

  grossBurn: string;

  netBurn: string;

  averageGrossBurn: string;

  averageNetBurn: string;
};

export type CashForecastSummary = {
  startingCash: string;

  endingCash: string;

  totalFinancingInflow: string;

  totalPrincipalRepayment: string;

  minimumEndingCash: string;
};

export function calculateCashForecastSummary(
  months: MonthlyForecast[],
): CashForecastSummary {
  if (
    months.length ===
    0
  ) {
    return {
      startingCash:
        "0",

      endingCash:
        "0",

      totalFinancingInflow:
        "0",

      totalPrincipalRepayment:
        "0",

      minimumEndingCash:
        "0",
    };
  }

  const minimumEndingCash =
    months.reduce(
      (
        minimum,
        month,
      ) => {
        const current =
          decimal(
            month.endingCash,
          );

        return current.lt(
          minimum,
        )
          ? current
          : minimum;
      },
      decimal(
        months[0]
          .endingCash,
      ),
    );

  return {
    startingCash:
      months[0]
        .openingCash,

    endingCash:
      months[
        months.length -
          1
      ].endingCash,

    totalFinancingInflow:
      toFinancialString(
        sumDecimals(
          months.map(
            (
              month,
            ) =>
              month.financingInflows
                .total,
          ),
        ),
      ),

    totalPrincipalRepayment:
      toFinancialString(
        sumDecimals(
          months.map(
            (
              month,
            ) =>
              month.debtPrincipalRepayment,
          ),
        ),
      ),

    minimumEndingCash:
      toFinancialString(
        minimumEndingCash,
      ),
  };
}

export function aggregateCashAnalytics(
  months: MonthlyForecast[],
): AnnualCashAnalytics[] {
  const grouped =
    new Map<
      number,
      MonthlyForecast[]
    >();

  for (
    const month
    of months
  ) {
    const group =
      grouped.get(
        month.year,
      ) ??
      [];

    group.push(
      month,
    );

    grouped.set(
      month.year,
      group,
    );
  }

  return Array.from(
    grouped.entries(),
  )
    .sort(
      (
        left,
        right,
      ) =>
        left[0] -
        right[0],
    )
    .map(
      (
        [
          year,
          yearMonths,
        ],
      ) => {
        const first =
          yearMonths[0];

        const last =
          yearMonths[
            yearMonths.length -
              1
          ];

        const grossBurnValues =
          yearMonths.map(
            (
              month,
            ) =>
              decimal(
                month.grossBurn,
              ),
          );

        const netBurnValues =
          yearMonths.map(
            (
              month,
            ) =>
              decimal(
                month.netBurn,
              ),
          );

        return {
          year,

          monthsIncluded:
            yearMonths.length,

          openingCash:
            first.openingCash,

          operatingCashInflow:
            toFinancialString(
              sumDecimals(
                yearMonths.map(
                  (
                    month,
                  ) =>
                    month.operatingCashInflow,
                ),
              ),
            ),

          operatingCashOutflow:
            toFinancialString(
              sumDecimals(
                yearMonths.map(
                  (
                    month,
                  ) =>
                    month.operatingCashOutflow,
                ),
              ),
            ),

          operatingCashFlow:
            toFinancialString(
              sumDecimals(
                yearMonths.map(
                  (
                    month,
                  ) =>
                    month.operatingCashFlow,
                ),
              ),
            ),

          financingInflow:
            toFinancialString(
              sumDecimals(
                yearMonths.map(
                  (
                    month,
                  ) =>
                    month.financingInflows
                      .total,
                ),
              ),
            ),

          debtPrincipalRepayment:
            toFinancialString(
              sumDecimals(
                yearMonths.map(
                  (
                    month,
                  ) =>
                    month.debtPrincipalRepayment,
                ),
              ),
            ),

          netCashMovement:
            toFinancialString(
              sumDecimals(
                yearMonths.map(
                  (
                    month,
                  ) =>
                    month.netCashMovement,
                ),
              ),
            ),

          endingCash:
            last.endingCash,

          grossBurn:
            toFinancialString(
              sumDecimals(
                yearMonths.map(
                  (
                    month,
                  ) =>
                    month.grossBurn,
                ),
              ),
            ),

          netBurn:
            toFinancialString(
              sumDecimals(
                yearMonths.map(
                  (
                    month,
                  ) =>
                    month.netBurn,
                ),
              ),
            ),

          averageGrossBurn:
            toFinancialString(
              averageDecimals(
                grossBurnValues,
              ),
            ),

          averageNetBurn:
            toFinancialString(
              averageDecimals(
                netBurnValues,
              ),
            ),
        };
      },
    );
}
