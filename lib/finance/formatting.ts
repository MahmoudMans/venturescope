import type {
  RunwayResult,
} from "@/lib/finance/types";

export type AnalysisTableView =
  | "monthly"
  | "annual";

function safeNumber(
  value:
    | string
    | number
    | null
    | undefined,
): number {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  const parsed =
    Number(value);

  return Number.isFinite(
    parsed,
  )
    ? parsed
    : 0;
}

export function resolveAnalysisTableView(
  value:
    | string
    | string[]
    | undefined,
): AnalysisTableView {
  const resolved =
    Array.isArray(value)
      ? value[0]
      : value;

  return resolved ===
    "annual"
    ? "annual"
    : "monthly";
}

export function formatCurrencyValue(
  value:
    | string
    | number,
  currency: string,
  options: {
    compact?: boolean;
    maximumFractionDigits?: number;
    minimumFractionDigits?: number;
  } = {},
): string {
  const amount =
    safeNumber(value);

  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency,
      notation:
        options.compact
          ? "compact"
          : "standard",
      compactDisplay:
        "short",
      maximumFractionDigits:
        options.maximumFractionDigits ??
        (
          options.compact
            ? 1
            : 0
        ),
      minimumFractionDigits:
        options.minimumFractionDigits ??
        0,
    },
  ).format(
    amount,
  );
}

export function formatExpenseCurrencyValue(
  value:
    | string
    | number,
  currency: string,
): string {
  const amount =
    Math.abs(
      safeNumber(
        value,
      ),
    );

  if (
    amount === 0
  ) {
    return formatCurrencyValue(
      0,
      currency,
    );
  }

  return `−${formatCurrencyValue(
    amount,
    currency,
  )}`;
}

export function formatCompactCurrencyValue(
  value:
    | string
    | number,
  currency: string,
): string {
  return formatCurrencyValue(
    value,
    currency,
    {
      compact: true,
      maximumFractionDigits: 1,
    },
  );
}

export function formatPercentageValue(
  value:
    | string
    | number
    | null,
  maximumFractionDigits =
    1,
): string {
  if (
    value === null
  ) {
    return "—";
  }

  return `${new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits,
      minimumFractionDigits: 0,
    },
  ).format(
    safeNumber(
      value,
    ),
  )}%`;
}

export function formatNumberValue(
  value:
    | string
    | number
    | null,
  maximumFractionDigits =
    2,
): string {
  if (
    value === null
  ) {
    return "—";
  }

  return new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits,
      minimumFractionDigits: 0,
    },
  ).format(
    safeNumber(
      value,
    ),
  );
}

export function formatCustomerValue(
  value:
    | string
    | number
    | null,
): string {
  if (
    value === null
  ) {
    return "—";
  }

  return new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    },
  ).format(
    safeNumber(
      value,
    ),
  );
}

export function formatMonthKey(
  month: string,
): string {
  const match =
    /^(\d{4})-(0[1-9]|1[0-2])$/.exec(
      month,
    );

  if (!match) {
    return month;
  }

  const year =
    Number(
      match[1],
    );

  const monthNumber =
    Number(
      match[2],
    );

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    },
  ).format(
    new Date(
      Date.UTC(
        year,
        monthNumber - 1,
        1,
      ),
    ),
  );
}

export function formatLongMonthKey(
  month:
    | string
    | null,
): string {
  if (!month) {
    return "Not reached";
  }

  const match =
    /^(\d{4})-(0[1-9]|1[0-2])$/.exec(
      month,
    );

  if (!match) {
    return month;
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    },
  ).format(
    new Date(
      Date.UTC(
        Number(
          match[1],
        ),
        Number(
          match[2],
        ) - 1,
        1,
      ),
    ),
  );
}

export function formatRunway(
  runway: RunwayResult,
): string {
  switch (
    runway.status
  ) {
    case "ZERO":
      return "0 mo";

    case "EXHAUSTED":
      return `${runway.months ?? 0} mo`;

    case "BEYOND_HORIZON":
      return `>${runway.horizonMonths} mo`;

    case "CASH_FLOW_POSITIVE":
      return "Cash-flow +";
  }
}

export function formatRunwayDetail(
  runway: RunwayResult,
): string {
  switch (
    runway.status
  ) {
    case "ZERO":
      return "Starting cash is already exhausted.";

    case "EXHAUSTED":
      return runway.exhaustedMonth
        ? `Cash reaches zero in ${formatLongMonthKey(
            runway.exhaustedMonth,
          )}.`
        : "Cash reaches zero within the forecast.";

    case "BEYOND_HORIZON":
      return `Cash remains above zero throughout the ${runway.horizonMonths}-month forecast.`;

    case "CASH_FLOW_POSITIVE":
      return "The final three months are operating cash-flow positive.";
  }
}
