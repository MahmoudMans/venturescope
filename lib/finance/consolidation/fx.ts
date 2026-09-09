import Decimal from "decimal.js";

import type {
  ResolvedFxRate,
  VentureScopeCurrency,
  WorkspaceFxRateView,
} from "@/lib/finance/consolidation/types";


function applicableRates({
  rates,
  asOfDate,
}: {
  rates:
    WorkspaceFxRateView[];

  asOfDate:
    string;
}) {
  return rates
    .filter(
      (
        rate,
      ) =>
        rate.effectiveDate <=
        asOfDate,
    )
    .sort(
      (
        left,
        right,
      ) =>
        right.effectiveDate.localeCompare(
          left.effectiveDate,
        ),
    );
}


export function resolveWorkspaceFxRate({
  sourceCurrency,
  reportingCurrency,
  asOfDate,
  rates,
}: {
  sourceCurrency:
    VentureScopeCurrency;

  reportingCurrency:
    VentureScopeCurrency;

  asOfDate:
    string;

  rates:
    WorkspaceFxRateView[];
}): ResolvedFxRate |
  null {
  if (
    sourceCurrency ===
    reportingCurrency
  ) {
    return {
      sourceCurrency,

      reportingCurrency,

      rate:
        1,

      effectiveDate:
        null,

      sourceLabel:
        "Identity conversion",

      direction:
        "IDENTITY",
    };
  }


  const eligible =
    applicableRates({
      rates,

      asOfDate,
    });


  const direct =
    eligible.find(
      (
        rate,
      ) =>
        rate.baseCurrency ===
          sourceCurrency &&
        rate.quoteCurrency ===
          reportingCurrency,
    );


  if (
    direct
  ) {
    return {
      sourceCurrency,

      reportingCurrency,

      rate:
        direct.rate,

      effectiveDate:
        direct.effectiveDate,

      sourceLabel:
        direct.sourceLabel,

      direction:
        "DIRECT",
    };
  }


  const inverse =
    eligible.find(
      (
        rate,
      ) =>
        rate.baseCurrency ===
          reportingCurrency &&
        rate.quoteCurrency ===
          sourceCurrency,
    );


  if (
    inverse
  ) {
    return {
      sourceCurrency,

      reportingCurrency,

      rate:
        new Decimal(
          1,
        )
          .div(
            inverse.rate,
          )
          .toNumber(),

      effectiveDate:
        inverse.effectiveDate,

      sourceLabel:
        `${inverse.sourceLabel} · inverse`,

      direction:
        "INVERSE",
    };
  }


  return null;
}


export function convertCurrencyAmount({
  amount,
  fx,
}: {
  amount:
    number;

  fx:
    ResolvedFxRate;
}): number {
  if (
    amount ===
    0
  ) {
    return 0;
  }


  return new Decimal(
    amount,
  )
    .mul(
      fx.rate,
    )
    .toDecimalPlaces(
      8,
    )
    .toNumber();
}
