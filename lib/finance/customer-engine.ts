import type Decimal from "decimal.js";

import type {
  CustomerRevenueAssumptions,
} from "@/lib/finance/assumptions/types";
import {
  ZERO,
  compoundValue,
  decimal,
  maxZero,
  percentageToRate,
} from "@/lib/finance/math";

export type CustomerRevenueMonthResult = {
  openingCustomers: Decimal;

  paidNewCustomers: Decimal;
  organicNewCustomers: Decimal;
  newCustomers: Decimal;

  churnedCustomers: Decimal;
  endingCustomers: Decimal;

  arpu: Decimal;

  recurringRevenue: Decimal;
  nonRecurringRevenue: Decimal;
  oneTimeRevenue: Decimal;
  totalRevenue: Decimal;

  mrr: Decimal;
};

export function calculateCustomerRevenueMonth(
  assumptions: CustomerRevenueAssumptions,
  monthIndex: number,
  openingCustomers: Decimal,
  monthlyMarketingBudget: Decimal,
): CustomerRevenueMonthResult {
  const cac =
    decimal(
      assumptions.cac,
    );

  const acquisitionGrowthRate =
    percentageToRate(
      assumptions
        .customerAcquisitionGrowthRate,
    );

  const acquisitionGrowthFactor =
    compoundValue(
      1,
      acquisitionGrowthRate,
      monthIndex,
    );

  const paidAcquisitionBase =
    cac.gt(
      ZERO,
    )
      ? monthlyMarketingBudget.div(
          cac,
        )
      : new (
          monthlyMarketingBudget
            .constructor as typeof Decimal
        )(0);

  const organicAcquisitionBase =
    decimal(
      assumptions
        .organicNewCustomers,
    );

  const paidNewCustomers =
    paidAcquisitionBase.mul(
      acquisitionGrowthFactor,
    );

  const organicNewCustomers =
    organicAcquisitionBase.mul(
      acquisitionGrowthFactor,
    );

  const newCustomers =
    paidNewCustomers.plus(
      organicNewCustomers,
    );

  const churnRate =
    percentageToRate(
      assumptions
        .monthlyChurnRate,
    );

  const churnedCustomers =
    openingCustomers.mul(
      churnRate,
    );

  const endingCustomers =
    maxZero(
      openingCustomers
        .plus(
          newCustomers,
        )
        .minus(
          churnedCustomers,
        ),
    );

  const arpuGrowthRate =
    percentageToRate(
      assumptions
        .arpuGrowthRate,
    );

  const arpu =
    compoundValue(
      assumptions.arpu,
      arpuGrowthRate,
      monthIndex,
    );

  const mrr =
    endingCustomers.mul(
      arpu,
    );

  const oneTimeRevenue =
    decimal(
      assumptions
        .monthlyOneTimeRevenue,
    );

  const totalRevenue =
    mrr.plus(
      oneTimeRevenue,
    );

  return {
    openingCustomers,

    paidNewCustomers,
    organicNewCustomers,
    newCustomers,

    churnedCustomers,
    endingCustomers,

    arpu,

    recurringRevenue:
      mrr,

    nonRecurringRevenue:
      oneTimeRevenue,

    oneTimeRevenue,

    totalRevenue,

    mrr,
  };
}
