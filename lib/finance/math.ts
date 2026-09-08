import Decimal from "decimal.js";

Decimal.set({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -50,
  toExpPos: 50,
});

export const ZERO =
  new Decimal(0);

export const ONE =
  new Decimal(1);

export function decimal(
  value:
    | Decimal.Value
    | null
    | undefined,
): Decimal {
  if (
    value ===
      null ||
    value ===
      undefined ||
    value ===
      ""
  ) {
    return new Decimal(0);
  }

  try {
    const result =
      new Decimal(value);

    if (
      !result.isFinite()
    ) {
      return new Decimal(0);
    }

    return result;
  } catch {
    return new Decimal(0);
  }
}

export function percentageToRate(
  value:
    | Decimal.Value
    | null
    | undefined,
): Decimal {
  return decimal(
    value,
  ).div(100);
}

export function rateToPercentage(
  value:
    | Decimal.Value,
): Decimal {
  return decimal(
    value,
  ).mul(100);
}

export function clampDecimal(
  value: Decimal,
  min: Decimal.Value,
  max: Decimal.Value,
): Decimal {
  const minimum =
    decimal(
      min,
    );

  const maximum =
    decimal(
      max,
    );

  if (
    value.lt(
      minimum,
    )
  ) {
    return minimum;
  }

  if (
    value.gt(
      maximum,
    )
  ) {
    return maximum;
  }

  return value;
}

export function maxZero(
  value: Decimal,
): Decimal {
  return value.lt(
    ZERO,
  )
    ? new Decimal(0)
    : value;
}

export function minDecimal(
  left: Decimal,
  right: Decimal,
): Decimal {
  return left.lte(
    right,
  )
    ? left
    : right;
}

export function compoundValue(
  startingValue: Decimal.Value,
  periodicRate: Decimal,
  periods: number,
): Decimal {
  if (
    periods <=
    0
  ) {
    return decimal(
      startingValue,
    );
  }

  const factor =
    ONE.plus(
      periodicRate,
    );

  if (
    factor.lte(
      ZERO,
    )
  ) {
    return new Decimal(0);
  }

  return decimal(
    startingValue,
  ).mul(
    factor.pow(
      periods,
    ),
  );
}

export function annualPercentageToMonthlyRate(
  annualPercentage:
    | Decimal.Value,
): Decimal {
  const annualRate =
    percentageToRate(
      annualPercentage,
    );

  const annualFactor =
    ONE.plus(
      annualRate,
    );

  if (
    annualFactor.lte(
      ZERO,
    )
  ) {
    return new Decimal(
      -1,
    );
  }

  return annualFactor
    .pow(
      ONE.div(
        12,
      ),
    )
    .minus(
      ONE,
    );
}

export function safeRatio(
  numerator: Decimal,
  denominator: Decimal,
): Decimal | null {
  if (
    denominator.eq(
      ZERO,
    )
  ) {
    return null;
  }

  return numerator.div(
    denominator,
  );
}

export function percentageRatio(
  numerator: Decimal,
  denominator: Decimal,
): Decimal | null {
  const ratio =
    safeRatio(
      numerator,
      denominator,
    );

  if (!ratio) {
    return null;
  }

  return ratio.mul(
    100,
  );
}

export function averageDecimals(
  values: Decimal[],
): Decimal {
  if (
    values.length ===
    0
  ) {
    return new Decimal(
      0,
    );
  }

  const sum =
    values.reduce(
      (
        total,
        value,
      ) =>
        total.plus(
          value,
        ),
      new Decimal(
        0,
      ),
    );

  return sum.div(
    values.length,
  );
}

export function sumDecimals(
  values: Array<
    Decimal.Value
  >,
): Decimal {
  return values.reduce<Decimal>(
    (
      total,
      value,
    ) =>
      total.plus(
        decimal(
          value,
        ),
      ),
    new Decimal(
      0,
    ),
  );
}

export function toFinancialString(
  value:
    | Decimal
    | Decimal.Value,
): string {
  const number =
    value instanceof Decimal
      ? value
      : decimal(
          value,
        );

  if (
    !number.isFinite()
  ) {
    return "0";
  }

  if (
    number.eq(
      ZERO,
    )
  ) {
    return "0";
  }

  const fixed =
    number.toFixed(
      12,
    );

  return fixed
    .replace(
      /(\.\d*?[1-9])0+$/,
      "$1",
    )
    .replace(
      /\.0+$/,
      "",
    );
}

export function nullableFinancialString(
  value:
    | Decimal
    | null,
): string | null {
  if (
    value ===
    null
  ) {
    return null;
  }

  return toFinancialString(
    value,
  );
}
