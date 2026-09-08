import Decimal from "decimal.js";

import {
  addMonths,
  compareMonths,
  monthDistance,
} from "@/lib/finance/dates";
import {
  ZERO,
  decimal,
  maxZero,
  minDecimal,
  percentageToRate,
} from "@/lib/finance/math";
import type {
  FinancingEventInput,
  MonthKey,
} from "@/lib/finance/types";

export type MonthlyFinancingResult = {
  equityInflow: Decimal;
  debtInflow: Decimal;
  grantInflow: Decimal;
  otherInflow: Decimal;

  totalInflow: Decimal;

  interestExpense: Decimal;

  principalRepayment: Decimal;
};

function emptyResult(): MonthlyFinancingResult {
  return {
    equityInflow:
      new Decimal(
        0,
      ),

    debtInflow:
      new Decimal(
        0,
      ),

    grantInflow:
      new Decimal(
        0,
      ),

    otherInflow:
      new Decimal(
        0,
      ),

    totalInflow:
      new Decimal(
        0,
      ),

    interestExpense:
      new Decimal(
        0,
      ),

    principalRepayment:
      new Decimal(
        0,
      ),
  };
}

function normalizedRepaymentStartMonth(
  event: FinancingEventInput,
): MonthKey {
  const defaultStart =
    addMonths(
      event.month,
      1,
    );

  if (
    !event.repaymentStartMonth
  ) {
    return defaultStart;
  }

  if (
    compareMonths(
      event.repaymentStartMonth,
      defaultStart,
    ) <
    0
  ) {
    return defaultStart;
  }

  return event.repaymentStartMonth;
}

function debtScheduleForMonth(
  event: FinancingEventInput,
  month: MonthKey,
): {
  interestExpense: Decimal;
  principalRepayment: Decimal;
} {
  if (
    event.type !==
    "DEBT"
  ) {
    return {
      interestExpense:
        new Decimal(
          0,
        ),

      principalRepayment:
        new Decimal(
          0,
        ),
    };
  }

  if (
    compareMonths(
      month,
      event.month,
    ) <
    0
  ) {
    return {
      interestExpense:
        new Decimal(
          0,
        ),

      principalRepayment:
        new Decimal(
          0,
        ),
    };
  }

  const amount =
    maxZero(
      decimal(
        event.amount,
      ),
    );

  const termMonths =
    event.termMonths &&
    event.termMonths >
      0
      ? Math.floor(
          event.termMonths,
        )
      : null;

  const repaymentStart =
    normalizedRepaymentStartMonth(
      event,
    );

  let principalPerMonth =
    new Decimal(
      0,
    );

  let priorPrincipalPayments =
    0;

  let currentPrincipalPayment =
    false;

  if (
    termMonths !==
    null
  ) {
    principalPerMonth =
      amount.div(
        termMonths,
      );

    const paymentDistance =
      monthDistance(
        repaymentStart,
        month,
      );

    priorPrincipalPayments =
      Math.max(
        0,
        Math.min(
          termMonths,
          paymentDistance,
        ),
      );

    currentPrincipalPayment =
      paymentDistance >=
        0 &&
      paymentDistance <
        termMonths;
  }

  const openingOutstanding =
    maxZero(
      amount.minus(
        principalPerMonth.mul(
          priorPrincipalPayments,
        ),
      ),
    );

  const aprRate =
    percentageToRate(
      event.apr ??
        "0",
    );

  const monthlyInterestRate =
    aprRate.div(
      12,
    );

  const interestExpense =
    compareMonths(
      month,
      event.month,
    ) >
      0 &&
    openingOutstanding.gt(
      ZERO,
    )
      ? openingOutstanding.mul(
          monthlyInterestRate,
        )
      : new Decimal(
          0,
        );

  const principalRepayment =
    currentPrincipalPayment
      ? minDecimal(
          principalPerMonth,
          openingOutstanding,
        )
      : new Decimal(
          0,
        );

  return {
    interestExpense,
    principalRepayment,
  };
}

export function calculateFinancingForMonth(
  events: FinancingEventInput[],
  month: MonthKey,
): MonthlyFinancingResult {
  const result =
    emptyResult();

  for (
    const event
    of events
  ) {
    const amount =
      maxZero(
        decimal(
          event.amount,
        ),
      );

    if (
      event.month ===
      month
    ) {
      switch (
        event.type
      ) {
        case "EQUITY":
          result.equityInflow =
            result.equityInflow.plus(
              amount,
            );
          break;

        case "DEBT":
          result.debtInflow =
            result.debtInflow.plus(
              amount,
            );
          break;

        case "GRANT":
          result.grantInflow =
            result.grantInflow.plus(
              amount,
            );
          break;

        case "OTHER":
          result.otherInflow =
            result.otherInflow.plus(
              amount,
            );
          break;
      }
    }

    const debtSchedule =
      debtScheduleForMonth(
        event,
        month,
      );

    result.interestExpense =
      result.interestExpense.plus(
        debtSchedule.interestExpense,
      );

    result.principalRepayment =
      result.principalRepayment.plus(
        debtSchedule.principalRepayment,
      );
  }

  result.totalInflow =
    result.equityInflow
      .plus(
        result.debtInflow,
      )
      .plus(
        result.grantInflow,
      )
      .plus(
        result.otherInflow,
      );

  return result;
}
