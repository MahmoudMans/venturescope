import type {
  MonthKey,
} from "@/lib/finance/types";

const MONTH_KEY_PATTERN =
  /^(\d{4})-(0[1-9]|1[0-2])$/;

export function assertMonthKey(
  value: string,
): asserts value is MonthKey {
  if (
    !MONTH_KEY_PATTERN.test(
      value,
    )
  ) {
    throw new Error(
      `Invalid financial month: ${value}`,
    );
  }
}

export function monthKeyToSerial(
  value: MonthKey,
): number {
  assertMonthKey(
    value,
  );

  const match =
    MONTH_KEY_PATTERN.exec(
      value,
    );

  if (!match) {
    throw new Error(
      `Invalid financial month: ${value}`,
    );
  }

  const year =
    Number(
      match[1],
    );

  const month =
    Number(
      match[2],
    );

  return (
    year *
      12 +
    month -
    1
  );
}

export function serialToMonthKey(
  serial: number,
): MonthKey {
  if (
    !Number.isInteger(
      serial,
    )
  ) {
    throw new Error(
      "Month serial must be an integer.",
    );
  }

  const year =
    Math.floor(
      serial /
        12,
    );

  const zeroBasedMonth =
    serial -
    year *
      12;

  const month =
    zeroBasedMonth +
    1;

  return `${year}-${String(
    month,
  ).padStart(
    2,
    "0",
  )}`;
}

export function addMonths(
  month: MonthKey,
  amount: number,
): MonthKey {
  if (
    !Number.isInteger(
      amount,
    )
  ) {
    throw new Error(
      "Month offset must be an integer.",
    );
  }

  return serialToMonthKey(
    monthKeyToSerial(
      month,
    ) +
      amount,
  );
}

export function monthDistance(
  from: MonthKey,
  to: MonthKey,
): number {
  return (
    monthKeyToSerial(
      to,
    ) -
    monthKeyToSerial(
      from,
    )
  );
}

export function compareMonths(
  left: MonthKey,
  right: MonthKey,
): number {
  return (
    monthKeyToSerial(
      left,
    ) -
    monthKeyToSerial(
      right,
    )
  );
}

export function enumerateMonths(
  startMonth: MonthKey,
  count: number,
): MonthKey[] {
  if (
    !Number.isInteger(
      count,
    ) ||
    count <
      0
  ) {
    throw new Error(
      "Forecast month count must be a non-negative integer.",
    );
  }

  return Array.from(
    {
      length: count,
    },
    (
      _,
      index,
    ) =>
      addMonths(
        startMonth,
        index,
      ),
  );
}

export function yearFromMonth(
  month: MonthKey,
): number {
  assertMonthKey(
    month,
  );

  return Number(
    month.slice(
      0,
      4,
    ),
  );
}

export function monthNumberFromMonth(
  month: MonthKey,
): number {
  assertMonthKey(
    month,
  );

  return Number(
    month.slice(
      5,
      7,
    ),
  );
}

export function dateToMonthKey(
  date: Date,
): MonthKey {
  const year =
    date.getUTCFullYear();

  const month =
    String(
      date.getUTCMonth() +
        1,
    ).padStart(
      2,
      "0",
    );

  return `${year}-${month}`;
}
