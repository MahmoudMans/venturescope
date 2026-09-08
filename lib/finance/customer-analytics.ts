import {
  decimal,
  sumDecimals,
  toFinancialString,
} from "@/lib/finance/math";
import type {
  MonthlyForecast,
} from "@/lib/finance/types";

export type CustomerForecastSummary = {
  startingCustomers: string;

  endingCustomers: string;

  totalPaidNewCustomers: string;

  totalOrganicNewCustomers: string;

  totalNewCustomers: string;

  totalChurnedCustomers: string;

  netCustomerGrowth: string;

  endingArpu: string;

  endingMrr: string;
};

export type AnnualCustomerAnalytics = {
  year: number;

  monthsIncluded: number;

  openingCustomers: string;

  paidNewCustomers: string;

  organicNewCustomers: string;

  newCustomers: string;

  churnedCustomers: string;

  endingCustomers: string;

  netCustomerGrowth: string;

  endingArpu: string;

  endingMrr: string;
};

function customerMonths(
  months: MonthlyForecast[],
): MonthlyForecast[] {
  return months.filter(
    (
      month,
    ) =>
      month.endingCustomers !==
      null,
  );
}

export function calculateCustomerForecastSummary(
  months: MonthlyForecast[],
): CustomerForecastSummary {
  const available =
    customerMonths(
      months,
    );

  if (
    available.length ===
    0
  ) {
    return {
      startingCustomers:
        "0",

      endingCustomers:
        "0",

      totalPaidNewCustomers:
        "0",

      totalOrganicNewCustomers:
        "0",

      totalNewCustomers:
        "0",

      totalChurnedCustomers:
        "0",

      netCustomerGrowth:
        "0",

      endingArpu:
        "0",

      endingMrr:
        "0",
    };
  }

  const first =
    available[0];

  const last =
    available[
      available.length -
        1
    ];

  const startingCustomers =
    decimal(
      first.openingCustomers ??
        "0",
    );

  const endingCustomers =
    decimal(
      last.endingCustomers ??
        "0",
    );

  return {
    startingCustomers:
      toFinancialString(
        startingCustomers,
      ),

    endingCustomers:
      toFinancialString(
        endingCustomers,
      ),

    totalPaidNewCustomers:
      toFinancialString(
        sumDecimals(
          available.map(
            (
              month,
            ) =>
              month.paidNewCustomers ??
              "0",
          ),
        ),
      ),

    totalOrganicNewCustomers:
      toFinancialString(
        sumDecimals(
          available.map(
            (
              month,
            ) =>
              month.organicNewCustomers ??
              "0",
          ),
        ),
      ),

    totalNewCustomers:
      toFinancialString(
        sumDecimals(
          available.map(
            (
              month,
            ) =>
              month.newCustomers ??
              "0",
          ),
        ),
      ),

    totalChurnedCustomers:
      toFinancialString(
        sumDecimals(
          available.map(
            (
              month,
            ) =>
              month.churnedCustomers ??
              "0",
          ),
        ),
      ),

    netCustomerGrowth:
      toFinancialString(
        endingCustomers.minus(
          startingCustomers,
        ),
      ),

    endingArpu:
      last.arpu ??
      "0",

    endingMrr:
      last.mrr,
  };
}

export function aggregateCustomerAnalytics(
  months: MonthlyForecast[],
): AnnualCustomerAnalytics[] {
  const available =
    customerMonths(
      months,
    );

  const grouped =
    new Map<
      number,
      MonthlyForecast[]
    >();

  for (
    const month
    of available
  ) {
    const group =
      grouped.get(
        month.year,
      ) ??
      [];

    group.push(
      month,
    );

    grouped.set(
      month.year,
      group,
    );
  }

  return Array.from(
    grouped.entries(),
  )
    .sort(
      (
        left,
        right,
      ) =>
        left[0] -
        right[0],
    )
    .map(
      (
        [
          year,
          yearMonths,
        ],
      ) => {
        const first =
          yearMonths[0];

        const last =
          yearMonths[
            yearMonths.length -
              1
          ];

        const openingCustomers =
          decimal(
            first.openingCustomers ??
              "0",
          );

        const endingCustomers =
          decimal(
            last.endingCustomers ??
              "0",
          );

        return {
          year,

          monthsIncluded:
            yearMonths.length,

          openingCustomers:
            toFinancialString(
              openingCustomers,
            ),

          paidNewCustomers:
            toFinancialString(
              sumDecimals(
                yearMonths.map(
                  (
                    month,
                  ) =>
                    month.paidNewCustomers ??
                    "0",
                ),
              ),
            ),

          organicNewCustomers:
            toFinancialString(
              sumDecimals(
                yearMonths.map(
                  (
                    month,
                  ) =>
                    month.organicNewCustomers ??
                    "0",
                ),
              ),
            ),

          newCustomers:
            toFinancialString(
              sumDecimals(
                yearMonths.map(
                  (
                    month,
                  ) =>
                    month.newCustomers ??
                    "0",
                ),
              ),
            ),

          churnedCustomers:
            toFinancialString(
              sumDecimals(
                yearMonths.map(
                  (
                    month,
                  ) =>
                    month.churnedCustomers ??
                    "0",
                ),
              ),
            ),

          endingCustomers:
            toFinancialString(
              endingCustomers,
            ),

          netCustomerGrowth:
            toFinancialString(
              endingCustomers.minus(
                openingCustomers,
              ),
            ),

          endingArpu:
            last.arpu ??
            "0",

          endingMrr:
            last.mrr,
        };
      },
    );
}
