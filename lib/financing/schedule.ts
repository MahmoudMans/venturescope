import {
  decimal,
  sumDecimals,
  toFinancialString,
} from "@/lib/finance/math";
import type {
  MonthlyForecast,
} from "@/lib/finance/types";

export type FinancingScheduleRow = {
  month: string;

  equityInflow: string;

  debtInflow: string;

  grantInflow: string;

  otherInflow: string;

  totalInflow: string;

  interestExpense: string;

  principalRepayment: string;

  netFinancingCashImpact: string;
};

export type FinancingScheduleSummary = {
  totalInflow: string;

  totalEquityInflow: string;

  totalDebtInflow: string;

  totalGrantInflow: string;

  totalOtherInflow: string;

  totalInterestExpense: string;

  totalPrincipalRepayment: string;

  netFinancingCashImpact: string;
};

export function buildFinancingSchedule(
  months: MonthlyForecast[],
): FinancingScheduleRow[] {
  return months
    .filter(
      (
        month,
      ) =>
        !decimal(
          month.financingInflows
            .total,
        ).eq(
          0,
        ) ||
        !decimal(
          month.interestExpense,
        ).eq(
          0,
        ) ||
        !decimal(
          month.debtPrincipalRepayment,
        ).eq(
          0,
        ),
    )
    .map(
      (
        month,
      ) => {
        const totalInflow =
          decimal(
            month.financingInflows
              .total,
          );

        const interest =
          decimal(
            month.interestExpense,
          );

        const principal =
          decimal(
            month.debtPrincipalRepayment,
          );

        return {
          month:
            month.month,

          equityInflow:
            month.financingInflows
              .equity,

          debtInflow:
            month.financingInflows
              .debt,

          grantInflow:
            month.financingInflows
              .grant,

          otherInflow:
            month.financingInflows
              .other,

          totalInflow:
            month.financingInflows
              .total,

          interestExpense:
            month.interestExpense,

          principalRepayment:
            month.debtPrincipalRepayment,

          netFinancingCashImpact:
            toFinancialString(
              totalInflow
                .minus(
                  interest,
                )
                .minus(
                  principal,
                ),
            ),
        };
      },
    );
}

export function summarizeFinancingSchedule(
  rows: FinancingScheduleRow[],
): FinancingScheduleSummary {
  const totalInflow =
    sumDecimals(
      rows.map(
        (
          row,
        ) =>
          row.totalInflow,
      ),
    );

  const totalInterest =
    sumDecimals(
      rows.map(
        (
          row,
        ) =>
          row.interestExpense,
      ),
    );

  const totalPrincipal =
    sumDecimals(
      rows.map(
        (
          row,
        ) =>
          row.principalRepayment,
      ),
    );

  return {
    totalInflow:
      toFinancialString(
        totalInflow,
      ),

    totalEquityInflow:
      toFinancialString(
        sumDecimals(
          rows.map(
            (
              row,
            ) =>
              row.equityInflow,
          ),
        ),
      ),

    totalDebtInflow:
      toFinancialString(
        sumDecimals(
          rows.map(
            (
              row,
            ) =>
              row.debtInflow,
          ),
        ),
      ),

    totalGrantInflow:
      toFinancialString(
        sumDecimals(
          rows.map(
            (
              row,
            ) =>
              row.grantInflow,
          ),
        ),
      ),

    totalOtherInflow:
      toFinancialString(
        sumDecimals(
          rows.map(
            (
              row,
            ) =>
              row.otherInflow,
          ),
        ),
      ),

    totalInterestExpense:
      toFinancialString(
        totalInterest,
      ),

    totalPrincipalRepayment:
      toFinancialString(
        totalPrincipal,
      ),

    netFinancingCashImpact:
      toFinancialString(
        totalInflow
          .minus(
            totalInterest,
          )
          .minus(
            totalPrincipal,
          ),
      ),
  };
}
