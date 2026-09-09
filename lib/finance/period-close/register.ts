import type {
  FinancialPeriodActualView,
  FinancialPeriodRegister,
  FinancialPeriodStateView,
} from "@/lib/finance/period-close/types";


export function buildFinancialPeriodRegister({
  actuals,
  states,
}: {
  actuals:
    FinancialPeriodActualView[];

  states:
    FinancialPeriodStateView[];
}): FinancialPeriodRegister {
  const statesByPeriod =
    new Map(
      states.map(
        (
          state,
        ) => [
          state.periodKey,
          state,
        ],
      ),
    );


  const rows =
    actuals
      .map(
        (
          actual,
        ) => {
          const state =
            statesByPeriod.get(
              actual.periodKey,
            );


          return {
            periodKey:
              actual.periodKey,

            status:
              state?.status ??
              "OPEN" as const,

            closeSequence:
              state?.closeSequence ??
              0,

            closedAt:
              state?.closedAt ??
              null,

            closedByUserId:
              state?.closedByUserId ??
              null,

            reopenedAt:
              state?.reopenedAt ??
              null,

            reopenedByUserId:
              state?.reopenedByUserId ??
              null,

            revenue:
              actual.revenue,

            ebitda:
              actual.ebitda,

            cashBalance:
              actual.cashBalance,
          };
        },
      )
      .sort(
        (
          left,
          right,
        ) =>
          right.periodKey.localeCompare(
            left.periodKey,
          ),
      );


  return {
    rows,

    summary: {
      totalPeriods:
        rows.length,

      openPeriods:
        rows.filter(
          (
            row,
          ) =>
            row.status ===
            "OPEN",
        ).length,

      closedPeriods:
        rows.filter(
          (
            row,
          ) =>
            row.status ===
            "CLOSED",
        ).length,

      closeCycles:
        rows.reduce(
          (
            total,
            row,
          ) =>
            total +
            row.closeSequence,
          0,
        ),
    },
  };
}
