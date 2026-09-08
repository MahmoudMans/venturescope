import Decimal from "decimal.js";

import type {
  MonthlyExpenseProfile,
} from "@/lib/finance/expense-engine";
import {
  decimal,
  maxZero,
  minDecimal,
  percentageToRate,
  sumDecimals,
} from "@/lib/finance/math";
import type {
  MonthKey,
  MonthlyOverrideInput,
  MonthlyOverrideValues,
  RevenueMode,
} from "@/lib/finance/types";

export type ResolvedMonthlyOverride = {
  applied: boolean;

  ids: string[];

  values: MonthlyOverrideValues;

  note: string | null;
};

export type CustomerRuntimeOverrides = {
  cac?: string;

  monthlyChurnRate?: string;

  arpu?: string;
};

function numericValue(
  value: unknown,
): string | undefined {
  if (
    typeof value !==
      "string" &&
    typeof value !==
      "number"
  ) {
    return undefined;
  }

  const normalized =
    String(
      value,
    ).trim();

  if (
    normalized ===
    ""
  ) {
    return undefined;
  }

  const parsed =
    decimal(
      normalized,
    );

  if (
    !parsed.isFinite()
  ) {
    return undefined;
  }

  return normalized;
}

export function parseMonthlyOverrideValues(
  value: unknown,
): MonthlyOverrideValues {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(
      value,
    )
  ) {
    return {};
  }

  const source =
    value as Record<
      string,
      unknown
    >;

  const result: MonthlyOverrideValues =
    {};

  const revenue =
    numericValue(
      source.revenue,
    );

  const marketing =
    numericValue(
      source.marketing,
    );

  const salaries =
    numericValue(
      source.salaries,
    );

  const rent =
    numericValue(
      source.rent,
    );

  const cogs =
    numericValue(
      source.cogs,
    );

  const cac =
    numericValue(
      source.cac,
    );

  const churnRate =
    numericValue(
      source.churnRate,
    );

  const arpu =
    numericValue(
      source.arpu,
    );

  if (
    revenue !==
    undefined
  ) {
    result.revenue =
      revenue;
  }

  if (
    marketing !==
    undefined
  ) {
    result.marketing =
      marketing;
  }

  if (
    salaries !==
    undefined
  ) {
    result.salaries =
      salaries;
  }

  if (
    rent !==
    undefined
  ) {
    result.rent =
      rent;
  }

  if (
    cogs !==
    undefined
  ) {
    result.cogs =
      cogs;
  }

  if (
    cac !==
    undefined
  ) {
    result.cac =
      cac;
  }

  if (
    churnRate !==
    undefined
  ) {
    result.churnRate =
      churnRate;
  }

  if (
    arpu !==
    undefined
  ) {
    result.arpu =
      arpu;
  }

  return result;
}

function mergeOverrideValues(
  current: MonthlyOverrideValues,
  next: MonthlyOverrideValues,
): MonthlyOverrideValues {
  return {
    ...current,
    ...next,
  };
}

export function resolveMonthlyOverride(
  overrides: MonthlyOverrideInput[],
  scenarioId:
    | string
    | undefined,
  month: MonthKey,
): ResolvedMonthlyOverride {
  const globalOverrides =
    overrides.filter(
      (
        override,
      ) =>
        override.month ===
          month &&
        !override.scenarioId,
    );

  const scenarioOverrides =
    scenarioId
      ? overrides.filter(
          (
            override,
          ) =>
            override.month ===
              month &&
            override.scenarioId ===
              scenarioId,
        )
      : [];

  const ordered = [
    ...globalOverrides,
    ...scenarioOverrides,
  ];

  if (
    ordered.length ===
    0
  ) {
    return {
      applied:
        false,

      ids:
        [],

      values:
        {},

      note:
        null,
    };
  }

  let values: MonthlyOverrideValues =
    {};

  const notes: string[] =
    [];

  for (
    const override
    of ordered
  ) {
    values =
      mergeOverrideValues(
        values,
        override.values,
      );

    if (
      override.note &&
      override.note.trim()
    ) {
      notes.push(
        override.note.trim(),
      );
    }
  }

  return {
    applied:
      Object.keys(
        values,
      ).length >
      0,

    ids:
      ordered
        .map(
          (
            override,
          ) =>
            override.id,
        )
        .filter(
          (
            id,
          ): id is string =>
            Boolean(
              id,
            ),
        ),

    values,

    note:
      notes.length >
      0
        ? notes.join(
            " · ",
          )
        : null,
  };
}

export function applyMonthlyExpenseOverrides(
  profile: MonthlyExpenseProfile,
  values: MonthlyOverrideValues,
): MonthlyExpenseProfile {
  const salaries =
    values.salaries !==
    undefined
      ? maxZero(
          decimal(
            values.salaries,
          ),
        )
      : profile.salaries;

  const rent =
    values.rent !==
    undefined
      ? maxZero(
          decimal(
            values.rent,
          ),
        )
      : profile.rent;

  const marketing =
    values.marketing !==
    undefined
      ? maxZero(
          decimal(
            values.marketing,
          ),
        )
      : profile.marketing;

  return {
    ...profile,

    salaries,

    rent,

    marketing,

    totalOperatingExpensesBeforeCogs:
      sumDecimals([
        salaries,
        rent,
        marketing,
        profile.otherOperatingExpenses,
      ]),
  };
}

export function customerRuntimeOverrides(
  values: MonthlyOverrideValues,
): CustomerRuntimeOverrides {
  const result: CustomerRuntimeOverrides =
    {};

  if (
    values.cac !==
    undefined
  ) {
    result.cac =
      values.cac;
  }

  if (
    values.churnRate !==
    undefined
  ) {
    result.monthlyChurnRate =
      values.churnRate;
  }

  if (
    values.arpu !==
    undefined
  ) {
    result.arpu =
      values.arpu;
  }

  return result;
}

export type RevenueOverrideState = {
  revenueMode: RevenueMode;

  overrideRevenue:
    | string
    | undefined;

  recurringRevenuePercentage: string;

  recurringRevenue: Decimal;

  nonRecurringRevenue: Decimal;

  oneTimeRevenue: Decimal;

  totalRevenue: Decimal;

  mrr: Decimal;
};

export function applyMonthlyRevenueOverride(
  state: RevenueOverrideState,
): {
  recurringRevenue: Decimal;

  nonRecurringRevenue: Decimal;

  oneTimeRevenue: Decimal;

  totalRevenue: Decimal;

  mrr: Decimal;
} {
  if (
    state.overrideRevenue ===
    undefined
  ) {
    return {
      recurringRevenue:
        state.recurringRevenue,

      nonRecurringRevenue:
        state.nonRecurringRevenue,

      oneTimeRevenue:
        state.oneTimeRevenue,

      totalRevenue:
        state.totalRevenue,

      mrr:
        state.mrr,
    };
  }

  const totalRevenue =
    maxZero(
      decimal(
        state.overrideRevenue,
      ),
    );

  if (
    state.revenueMode ===
    "DIRECT"
  ) {
    const recurringShare =
      percentageToRate(
        state.recurringRevenuePercentage,
      );

    const recurringRevenue =
      totalRevenue.mul(
        recurringShare,
      );

    const nonRecurringRevenue =
      totalRevenue.minus(
        recurringRevenue,
      );

    return {
      recurringRevenue,

      nonRecurringRevenue,

      oneTimeRevenue:
        nonRecurringRevenue,

      totalRevenue,

      mrr:
        recurringRevenue,
    };
  }

  const recurringRevenue =
    minDecimal(
      state.mrr,
      totalRevenue,
    );

  const nonRecurringRevenue =
    maxZero(
      totalRevenue.minus(
        recurringRevenue,
      ),
    );

  return {
    recurringRevenue,

    nonRecurringRevenue,

    oneTimeRevenue:
      nonRecurringRevenue,

    totalRevenue,

    mrr:
      state.mrr,
  };
}
