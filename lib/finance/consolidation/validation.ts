import {
  VENTURESCOPE_CURRENCIES,
  type VentureScopeCurrency,
} from "@/lib/finance/consolidation/types";


export function parseVentureScopeCurrency(
  value:
    string,
): VentureScopeCurrency {
  const normalized =
    value
      .trim()
      .toUpperCase();


  if (
    VENTURESCOPE_CURRENCIES.includes(
      normalized as
        VentureScopeCurrency,
    )
  ) {
    return normalized as
      VentureScopeCurrency;
  }


  throw new Error(
    "Unsupported VentureScope currency.",
  );
}


export function parseFxRate(
  value:
    string,
): number {
  const parsed =
    Number(
      value,
    );


  if (
    !Number.isFinite(
      parsed,
    ) ||
    parsed <=
      0 ||
    parsed >
      1_000_000
  ) {
    throw new Error(
      "FX rate must be greater than zero and no greater than 1,000,000.",
    );
  }


  return parsed;
}


export function parseFxDate(
  value:
    string,
): string {
  const normalized =
    value.trim();


  if (
    !/^\d{4}-\d{2}-\d{2}$/u.test(
      normalized,
    )
  ) {
    throw new Error(
      "FX effective date must use YYYY-MM-DD.",
    );
  }


  const date =
    new Date(
      `${normalized}T00:00:00.000Z`,
    );


  if (
    Number.isNaN(
      date.getTime(),
    ) ||
    date
      .toISOString()
      .slice(
        0,
        10,
      ) !==
      normalized
  ) {
    throw new Error(
      "FX effective date is invalid.",
    );
  }


  return normalized;
}


export function parseFxSourceLabel(
  value:
    string,
): string {
  const normalized =
    value.trim();


  if (
    normalized.length <
      2 ||
    normalized.length >
      120
  ) {
    throw new Error(
      "FX source label must contain between 2 and 120 characters.",
    );
  }


  return normalized;
}


export function assertDistinctCurrencyPair({
  baseCurrency,
  quoteCurrency,
}: {
  baseCurrency:
    VentureScopeCurrency;

  quoteCurrency:
    VentureScopeCurrency;
}) {
  if (
    baseCurrency ===
    quoteCurrency
  ) {
    throw new Error(
      "Base and quote currencies must be different.",
    );
  }
}
