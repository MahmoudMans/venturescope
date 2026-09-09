import {
  parseMonthKey,
} from "@/lib/finance/actuals/month";

import {
  FINANCIAL_PERIOD_EVENT_ACTIONS,
  FINANCIAL_PERIOD_STATUSES,
  type FinancialPeriodEventAction,
  type FinancialPeriodStatus,
} from "@/lib/finance/period-close/types";


export function parseFinancialPeriodKey(
  raw:
    string,
): string {
  const parsed =
    parseMonthKey(
      raw,
    );


  if (
    !parsed
  ) {
    throw new Error(
      "Financial period must be a valid month.",
    );
  }


  return parsed;
}


export function financialPeriodDate(
  periodKey:
    string,
): Date {
  const normalized =
    parseFinancialPeriodKey(
      periodKey,
    );


  const result =
    new Date(
      `${normalized}-01T00:00:00.000Z`,
    );


  if (
    Number.isNaN(
      result.getTime(),
    )
  ) {
    throw new Error(
      "Financial period date is invalid.",
    );
  }


  return result;
}


export function financialPeriodKeyFromDate(
  value:
    Date,
): string {
  return `${value
    .getUTCFullYear()
    .toString()
    .padStart(
      4,
      "0",
    )}-${(
    value.getUTCMonth() +
    1
  )
    .toString()
    .padStart(
      2,
      "0",
    )}`;
}


export function parseFinancialPeriodStatus(
  value:
    string,
): FinancialPeriodStatus {
  if (
    FINANCIAL_PERIOD_STATUSES.includes(
      value as
        FinancialPeriodStatus,
    )
  ) {
    return value as
      FinancialPeriodStatus;
  }


  throw new Error(
    "Invalid financial period status.",
  );
}


export function parseFinancialPeriodEventAction(
  value:
    string,
): FinancialPeriodEventAction {
  if (
    FINANCIAL_PERIOD_EVENT_ACTIONS.includes(
      value as
        FinancialPeriodEventAction,
    )
  ) {
    return value as
      FinancialPeriodEventAction;
  }


  throw new Error(
    "Invalid financial period event action.",
  );
}


export function validateCloseConfirmation({
  periodKey,
  confirmation,
}: {
  periodKey:
    string;

  confirmation:
    string;
}) {
  const expected =
    `CLOSE ${periodKey}`;


  if (
    confirmation.trim() !==
    expected
  ) {
    throw new Error(
      `Confirmation must exactly match "${expected}".`,
    );
  }
}


export function validateReopenConfirmation({
  periodKey,
  confirmation,
}: {
  periodKey:
    string;

  confirmation:
    string;
}) {
  const expected =
    `REOPEN ${periodKey}`;


  if (
    confirmation.trim() !==
    expected
  ) {
    throw new Error(
      `Confirmation must exactly match "${expected}".`,
    );
  }
}
