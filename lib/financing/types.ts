import {
  dateToMonthKey,
} from "@/lib/finance/dates";

export type FinancingEventType =
  | "EQUITY"
  | "DEBT"
  | "GRANT"
  | "OTHER";

export type FinancingEventViewModel = {
  id: string;

  name: string;

  type: FinancingEventType;

  month: string;

  amount: string;

  apr: string | null;

  termMonths: number | null;

  repaymentStartMonth: string | null;

  createdAt: string;

  updatedAt: string;
};

type StringableValue = {
  toString(): string;
};

type PersistedFinancingEvent = {
  id: string;

  name: string;

  type:
    | FinancingEventType
    | string;

  month: Date;

  amount:
    | string
    | number
    | StringableValue;

  apr:
    | string
    | number
    | StringableValue
    | null;

  termMonths:
    | number
    | null;

  repaymentStartMonth:
    | Date
    | null;

  createdAt: Date;

  updatedAt: Date;
};

function asFinancingType(
  value: string,
): FinancingEventType {
  if (
    value === "EQUITY" ||
    value === "DEBT" ||
    value === "GRANT" ||
    value === "OTHER"
  ) {
    return value;
  }

  throw new Error(
    `Unsupported financing type: ${value}`,
  );
}

export function serializeFinancingEvent(
  event: PersistedFinancingEvent,
): FinancingEventViewModel {
  return {
    id:
      event.id,

    name:
      event.name,

    type:
      asFinancingType(
        event.type,
      ),

    month:
      dateToMonthKey(
        event.month,
      ),

    amount:
      String(
        event.amount,
      ),

    apr:
      event.apr ===
      null
        ? null
        : String(
            event.apr,
          ),

    termMonths:
      event.termMonths,

    repaymentStartMonth:
      event.repaymentStartMonth
        ? dateToMonthKey(
            event.repaymentStartMonth,
          )
        : null,

    createdAt:
      event.createdAt.toISOString(),

    updatedAt:
      event.updatedAt.toISOString(),
  };
}
