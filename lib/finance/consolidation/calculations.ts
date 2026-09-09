import Decimal from "decimal.js";

import {
  convertCurrencyAmount,
  resolveWorkspaceFxRate,
} from "@/lib/finance/consolidation/fx";

import type {
  ConsolidatedPortfolioReport,
  VentureScopeCurrency,
  WorkspaceFxRateView,
} from "@/lib/finance/consolidation/types";


export type ConsolidationAnalyticsInput = {
  projectId:
    string;

  name:
    string;

  industry:
    string;

  currency:
    VentureScopeCurrency;

  latestActualPeriod:
    string |
    null;

  latestActualCash:
    number |
    null;

  capitalNeed:
    number |
    null;

  forecastAvailable:
    boolean;
};


export function buildConsolidatedPortfolioReport({
  projects,
  reportingCurrency,
  asOfDate,
  rates,
}: {
  projects:
    ConsolidationAnalyticsInput[];

  reportingCurrency:
    VentureScopeCurrency;

  asOfDate:
    string;

  rates:
    WorkspaceFxRateView[];
}): ConsolidatedPortfolioReport {
  let totalCash =
    new Decimal(
      0,
    );


  let totalCapitalNeed =
    new Decimal(
      0,
    );


  let missingCashRates =
    0;


  let missingCapitalRates =
    0;


  const rows =
    projects.map(
      (
        project,
      ) => {
        const needsFx =
          project.currency !==
          reportingCurrency;


        const amountRequiresRate =
          (
            project.latestActualCash !==
              null &&
            project.latestActualCash !==
              0
          ) ||
          (
            project.capitalNeed !==
              null &&
            project.capitalNeed !==
              0
          );


        const resolvedFx =
          needsFx &&
          amountRequiresRate
            ?
              resolveWorkspaceFxRate({
                sourceCurrency:
                  project.currency,

                reportingCurrency,

                asOfDate,

                rates,
              })
            :
              resolveWorkspaceFxRate({
                sourceCurrency:
                  reportingCurrency,

                reportingCurrency,

                asOfDate,

                rates,
              });


        let consolidatedCash:
          number |
          null =
            null;


        if (
          project.latestActualCash !==
          null
        ) {
          if (
            project.latestActualCash ===
            0
          ) {
            consolidatedCash =
              0;
          }
          else if (
            resolvedFx &&
            (
              !needsFx ||
              resolvedFx.sourceCurrency ===
                project.currency
            )
          ) {
            consolidatedCash =
              convertCurrencyAmount({
                amount:
                  project.latestActualCash,

                fx:
                  resolvedFx,
              });
          }
          else {
            missingCashRates +=
              1;
          }
        }


        let consolidatedCapitalNeed:
          number |
          null =
            null;


        if (
          project.capitalNeed !==
          null
        ) {
          if (
            project.capitalNeed ===
            0
          ) {
            consolidatedCapitalNeed =
              0;
          }
          else if (
            resolvedFx &&
            (
              !needsFx ||
              resolvedFx.sourceCurrency ===
                project.currency
            )
          ) {
            consolidatedCapitalNeed =
              convertCurrencyAmount({
                amount:
                  project.capitalNeed,

                fx:
                  resolvedFx,
              });
          }
          else {
            missingCapitalRates +=
              1;
          }
        }


        if (
          consolidatedCash !==
          null
        ) {
          totalCash =
            totalCash.plus(
              consolidatedCash,
            );
        }


        if (
          consolidatedCapitalNeed !==
          null
        ) {
          totalCapitalNeed =
            totalCapitalNeed.plus(
              consolidatedCapitalNeed,
            );
        }


        return {
          projectId:
            project.projectId,

          name:
            project.name,

          industry:
            project.industry,

          sourceCurrency:
            project.currency,

          latestActualPeriod:
            project.latestActualPeriod,

          latestActualCash:
            project.latestActualCash,

          capitalNeed:
            project.capitalNeed,

          forecastAvailable:
            project.forecastAvailable,

          resolvedFx:
            needsFx
              ?
                resolvedFx
              :
                resolveWorkspaceFxRate({
                  sourceCurrency:
                    project.currency,

                  reportingCurrency,

                  asOfDate,

                  rates,
                }),

          consolidatedCash,

          consolidatedCapitalNeed,
        };
      },
    );


  return {
    reportingCurrency,

    asOfDate,

    rows,

    totalCash:
      totalCash
        .toDecimalPlaces(
          8,
        )
        .toNumber(),

    totalCapitalNeed:
      totalCapitalNeed
        .toDecimalPlaces(
          8,
        )
        .toNumber(),

    projects:
      rows.length,

    forecastReady:
      rows.filter(
        (
          row,
        ) =>
          row.forecastAvailable,
      ).length,

    missingCashRates,

    missingCapitalRates,

    complete:
      missingCashRates ===
        0 &&
      missingCapitalRates ===
        0,
  };
}
